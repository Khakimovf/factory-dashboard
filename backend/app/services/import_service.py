import csv
import io
import uuid
import bcrypt
from sqlalchemy.orm import Session
from app.models.wms import WMSMaterial, WMSBin, WMSZone
from app.models.user import User, UserRole
from typing import List, Dict, Any, Optional

class ImportService:
    @staticmethod
    def import_materials(db: Session, csv_content: str) -> Dict[str, Any]:
        """
        Import materials from CSV.
        Expected headers: sku, description
        """
        reader = csv.DictReader(io.StringIO(csv_content))
        count = 0
        errors = []
        
        for row in reader:
            try:
                sku = row.get('sku')
                description = row.get('description', '')
                
                if not sku:
                    errors.append(f"Row {count+1}: Missing SKU")
                    continue
                
                material = db.query(WMSMaterial).filter(WMSMaterial.sku == sku).first()
                if material:
                    material.description = description
                else:
                    material = WMSMaterial(sku=sku, description=description)
                    db.add(material)
                count += 1
            except Exception as e:
                errors.append(f"Row {count+1}: {str(e)}")
        
        db.commit()
        return {"imported": count, "errors": errors}

    @staticmethod
    def import_bins(db: Session, csv_content: str) -> Dict[str, Any]:
        """
        Import bins and zones from CSV.
        Expected headers: bin_code, zone_code, zone_description, zone_type, max_capacity
        """
        reader = csv.DictReader(io.StringIO(csv_content))
        count = 0
        errors = []
        
        for row in reader:
            try:
                bin_code = row.get('bin_code')
                zone_code = row.get('zone_code')
                zone_desc = row.get('zone_description', 'Auto-imported zone')
                zone_type = row.get('zone_type', 'STORAGE')
                max_cap = int(row.get('max_capacity', 1000))
                
                if not bin_code or not zone_code:
                    errors.append(f"Row {count+1}: Missing bin_code or zone_code")
                    continue
                
                # Ensure zone exists
                zone = db.query(WMSZone).filter(WMSZone.zone_code == zone_code).first()
                if not zone:
                    zone = WMSZone(zone_code=zone_code, description=zone_desc, type=zone_type)
                    db.add(zone)
                    db.flush() # Get zone id
                
                bin_item = db.query(WMSBin).filter(WMSBin.bin_code == bin_code).first()
                if bin_item:
                    bin_item.zone_id = zone.id
                    bin_item.max_capacity_pcs = max_cap
                else:
                    bin_item = WMSBin(bin_code=bin_code, zone_id=zone.id, max_capacity_pcs=max_cap)
                    db.add(bin_item)
                count += 1
            except Exception as e:
                errors.append(f"Row {count+1}: {str(e)}")
        
        db.commit()
        return {"imported": count, "errors": errors}

    @staticmethod
    def import_employees(csv_content: str) -> Dict[str, Any]:
        """
        Import employees/users from CSV.
        Expected headers: username, full_name, employee_id, role, password
        """
        from app.repositories.user_repository import UserRepository
        user_repo = UserRepository()
        reader = csv.DictReader(io.StringIO(csv_content))
        count = 0
        errors = []
        
        for row in reader:
            try:
                username = row.get('username')
                full_name = row.get('full_name')
                emp_id = row.get('employee_id')
                role_str = row.get('role', 'ADMIN')
                password = row.get('password', 'Changeme123!')
                
                if not username or not full_name or not emp_id:
                    errors.append(f"Row {count+1}: Missing username, full_name, or employee_id")
                    continue
                
                # Check if exists
                if user_repo.get_by_username(username):
                    errors.append(f"Row {count+1}: Username '{username}' already exists")
                    continue
                
                # Role validation
                try:
                    role = UserRole(role_str)
                except ValueError:
                    role = UserRole.ADMIN # Fallback
                
                hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                new_user = User(
                    id=str(uuid.uuid4()),
                    username=username,
                    full_name=full_name,
                    employee_id=emp_id,
                    role=role,
                    is_first_login=True,
                    password_hash=hashed
                )
                user_repo.create(new_user)
                count += 1
            except Exception as e:
                errors.append(f"Row {count+1}: {str(e)}")
        
        return {"imported": count, "errors": errors}
