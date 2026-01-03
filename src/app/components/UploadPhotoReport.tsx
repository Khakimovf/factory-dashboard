import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { maintenanceApi } from '../services/maintenanceApi';
import { ArrowLeft, Upload, X, Camera, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';

export function UploadPhotoReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

  useEffect(() => {
    // Cleanup previews when component unmounts
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [previews]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Filter only image files
    const imageFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      alert(t('maintenance.selectImageFiles'));
      return;
    }

    setFiles(prev => [...prev, ...imageFiles]);
    
    // Create previews
    const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previews[index]);
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!id || files.length === 0) return;

    try {
      setUploading(true);
      setUploadedCount(0);

      for (let i = 0; i < files.length; i++) {
        await maintenanceApi.uploadPhoto(id, files[i]);
        setUploadedCount(i + 1);
      }

      // Navigate back to report detail
      navigate(`/maintenance/failure-reports/${id}`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert(t('maintenance.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/maintenance/failure-reports/${id}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('maintenance.backToReport')}
        </Button>
        
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
          {t('maintenance.uploadPhotoReport')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t('maintenance.uploadPhotoReportDesc')}
        </p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {t('maintenance.selectPhotos')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Input */}
          <div>
            <Label htmlFor="photo-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {t('maintenance.clickToSelect')} {t('maintenance.orDragAndDrop')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {t('maintenance.imageFormats')}
                </p>
              </div>
            </Label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Preview Grid */}
          {previews.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('maintenance.selectedPhotos')} ({files.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {files[index].name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div className="flex-1">
                  <p className="text-blue-900 dark:text-blue-200 font-medium">
                    {t('maintenance.uploading')}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {uploadedCount} / {files.length} {t('maintenance.photosUploaded')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/maintenance/failure-reports/${id}`)}
              className="flex-1"
            >
              {t('maintenance.cancel')}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('maintenance.uploading')}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {t('maintenance.uploadPhotos')} ({files.length})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




