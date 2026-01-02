# Production Line Detail UI Changes Plan

## File to Modify
**`src/app/components/ProductionLineDetail.tsx`**

## Changes Summary

### 1. Add State for Maintenance Request Form
**Location:** After line 12 (existing state declarations)
```typescript
const [maintenanceDescription, setMaintenanceDescription] = useState('');
const [maintenanceDateTime, setMaintenanceDateTime] = useState('');
```

### 2. Replace "Quick Actions" Panel with "Maintenance Request" Panel
**Location:** Lines 129-142 (current Quick Actions panel)

**REPLACE THIS:**
```typescript
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('productionDetail.quickActions')}</h3>
  <div className="space-y-2">
    <button className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left">
      {t('productionDetail.viewReport')}
    </button>
    <button className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left">
      {t('productionDetail.scheduleMaintenance')}
    </button>
    <button className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left">
      {t('productionDetail.exportData')}
    </button>
  </div>
</div>
```

**WITH THIS:**
```typescript
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
    {t('productionDetail.sendMaintenanceRequest')}
  </h3>
  <form onSubmit={(e) => {
    e.preventDefault();
    // UI only - no backend call
    alert(t('productionDetail.requestSubmitted'));
    setMaintenanceDescription('');
    setMaintenanceDateTime('');
  }}>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('productionDetail.failureDescription')}
        </label>
        <textarea
          value={maintenanceDescription}
          onChange={(e) => setMaintenanceDescription(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder={t('productionDetail.failureDescriptionPlaceholder')}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('productionDetail.failureTime')}
        </label>
        <input
          type="datetime-local"
          value={maintenanceDateTime}
          onChange={(e) => setMaintenanceDateTime(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        {t('productionDetail.submitRequest')}
      </button>
    </div>
  </form>
</div>
```

### 3. Move "Quick Actions" Panel to Bottom
**Location:** After line 220 (after the closing `</div>` of the grid), before the Add Material Modal

**ADD THIS:**
```typescript
      {/* Quick Actions - Moved to Bottom */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('productionDetail.quickActions')}</h3>
        <div className="space-y-2">
          <button className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left">
            {t('productionDetail.viewReport')}
          </button>
          <button className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left">
            {t('productionDetail.scheduleMaintenance')}
          </button>
          <button className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left">
            {t('productionDetail.exportData')}
          </button>
        </div>
      </div>
```

### 4. Add Translations
**Files:** `src/locales/uz.json` and `src/locales/ru.json`

**Add to `productionDetail` section:**

**uz.json:**
```json
"sendMaintenanceRequest": "Ta'mirlashga so'rov yuborish",
"failureDescription": "Nosozlik tavsifi",
"failureDescriptionPlaceholder": "Nosozlikni batafsil tasvirlang...",
"failureTime": "Nosozlik vaqti",
"submitRequest": "So'rovni yuborish",
"requestSubmitted": "So'rov muvaffaqiyatli yuborildi"
```

**ru.json:**
```json
"sendMaintenanceRequest": "Отправить запрос на ремонт",
"failureDescription": "Описание отказа",
"failureDescriptionPlaceholder": "Подробно опишите отказ...",
"failureTime": "Время отказа",
"submitRequest": "Отправить запрос",
"requestSubmitted": "Запрос успешно отправлен"
```

## Summary

- **1 file modified:** `src/app/components/ProductionLineDetail.tsx`
- **2 files modified:** `src/locales/uz.json` and `src/locales/ru.json`
- **Changes:** 
  - Move Quick Actions panel to bottom
  - Add Maintenance Request form panel
  - Add form state management
  - Add translations
- **No backend changes**
- **No routing changes**
- **No business logic changes** (UI only with alert for submission)

