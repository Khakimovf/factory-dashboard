import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  mockLeaveRequests,
  mockTimeOffRequests,
  mockHRInfoRequests,
  LeaveRequest,
  TimeOffRequest,
  HRInfoRequest,
} from '../../data/essData';
import { Calendar, Clock, MessageSquare, Plus, CheckCircle, XCircle, Clock as ClockIcon } from 'lucide-react';

type RequestType = 'leave' | 'timeoff' | 'hrinfo';

export function ESSRequests() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<RequestType>('leave');
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showTimeOffForm, setShowTimeOffForm] = useState(false);
  const [showHRInfoForm, setShowHRInfoForm] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            {t('ess.requests.statusApproved')}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <XCircle className="w-3 h-3" />
            {t('ess.requests.statusRejected')}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
            <ClockIcon className="w-3 h-3" />
            {t('ess.requests.statusPending')}
          </span>
        );
      case 'responded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            <CheckCircle className="w-3 h-3" />
            {t('ess.requests.statusResponded')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('leave')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'leave'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {t('ess.requests.leaveRequests')}
        </button>
        <button
          onClick={() => setActiveTab('timeoff')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'timeoff'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {t('ess.requests.timeOffRequests')}
        </button>
        <button
          onClick={() => setActiveTab('hrinfo')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'hrinfo'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {t('ess.requests.hrInfoRequests')}
        </button>
      </div>

      {/* Leave Requests */}
      {activeTab === 'leave' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('ess.requests.leaveRequests')}
            </h3>
            <button
              onClick={() => setShowLeaveForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              {t('ess.requests.newLeaveRequest')}
            </button>
          </div>

          {showLeaveForm && (
            <LeaveRequestForm
              onClose={() => setShowLeaveForm(false)}
              onSubmit={(data) => {
                // TODO: Submit to backend API
                console.log('Leave request:', data);
                setShowLeaveForm(false);
                alert(t('ess.requests.submitPlaceholder'));
              }}
            />
          )}

          <RequestList
            requests={mockLeaveRequests}
            renderRequest={(req: LeaveRequest) => (
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t(`ess.requests.leaveType${req.type.charAt(0).toUpperCase() + req.type.slice(1)}`)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(req.startDate).toLocaleDateString('uz-UZ')} -{' '}
                      {new Date(req.endDate).toLocaleDateString('uz-UZ')} ({req.days}{' '}
                      {t('ess.leave.days')})
                    </p>
                  </div>
                  {getStatusBadge(req.status)}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">{req.reason}</p>
                {req.reviewer && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('ess.requests.reviewedBy')}: {req.reviewer}
                  </p>
                )}
              </div>
            )}
            emptyMessage={t('ess.requests.noLeaveRequests')}
          />
        </div>
      )}

      {/* Time-Off Requests */}
      {activeTab === 'timeoff' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('ess.requests.timeOffRequests')}
            </h3>
            <button
              onClick={() => setShowTimeOffForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              {t('ess.requests.newTimeOffRequest')}
            </button>
          </div>

          {showTimeOffForm && (
            <TimeOffRequestForm
              onClose={() => setShowTimeOffForm(false)}
              onSubmit={(data) => {
                // TODO: Submit to backend API
                console.log('Time-off request:', data);
                setShowTimeOffForm(false);
                alert(t('ess.requests.submitPlaceholder'));
              }}
            />
          )}

          <RequestList
            requests={mockTimeOffRequests}
            renderRequest={(req: TimeOffRequest) => (
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t(`ess.requests.timeOffType${req.type.charAt(0).toUpperCase() + req.type.slice(1)}`)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(req.date).toLocaleDateString('uz-UZ')}
                      {req.hours && ` • ${req.hours} ${t('ess.attendance.hours')}`}
                    </p>
                  </div>
                  {getStatusBadge(req.status)}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">{req.reason}</p>
              </div>
            )}
            emptyMessage={t('ess.requests.noTimeOffRequests')}
          />
        </div>
      )}

      {/* HR Info Requests */}
      {activeTab === 'hrinfo' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('ess.requests.hrInfoRequests')}
            </h3>
            <button
              onClick={() => setShowHRInfoForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              {t('ess.requests.newHRInfoRequest')}
            </button>
          </div>

          {showHRInfoForm && (
            <HRInfoRequestForm
              onClose={() => setShowHRInfoForm(false)}
              onSubmit={(data) => {
                // TODO: Submit to backend API
                console.log('HR info request:', data);
                setShowHRInfoForm(false);
                alert(t('ess.requests.submitPlaceholder'));
              }}
            />
          )}

          <RequestList
            requests={mockHRInfoRequests}
            renderRequest={(req: HRInfoRequest) => (
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {req.subject}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(req.submittedDate).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                  {getStatusBadge(req.status)}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">{req.message}</p>
                {req.response && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
                      {t('ess.requests.response')}:
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-400">{req.response}</p>
                  </div>
                )}
              </div>
            )}
            emptyMessage={t('ess.requests.noHRInfoRequests')}
          />
        </div>
      )}
    </div>
  );
}

interface RequestListProps<T> {
  requests: T[];
  renderRequest: (request: T) => React.ReactNode;
  emptyMessage: string;
}

function RequestList<T>({ requests, renderRequest, emptyMessage }: RequestListProps<T>) {
  if (requests.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
        >
          {renderRequest(request)}
        </div>
      ))}
    </div>
  );
}

// Form Components
interface LeaveRequestFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

function LeaveRequestForm({ onClose, onSubmit }: LeaveRequestFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    type: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Validate form data
    onSubmit(formData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('ess.requests.newLeaveRequest')}
      </h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('ess.requests.leaveType')}
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="annual">{t('ess.requests.leaveTypeAnnual')}</option>
            <option value="sick">{t('ess.requests.leaveTypeSick')}</option>
            <option value="personal">{t('ess.requests.leaveTypePersonal')}</option>
            <option value="unpaid">{t('ess.requests.leaveTypeUnpaid')}</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('ess.requests.startDate')}
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('ess.requests.endDate')}
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('ess.requests.reason')}
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            rows={3}
            required
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {t('ess.requests.submit')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium"
          >
            {t('ess.requests.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}

interface TimeOffRequestFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

function TimeOffRequestForm({ onClose, onSubmit }: TimeOffRequestFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    type: 'half_day',
    date: '',
    hours: '',
    reason: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('ess.requests.newTimeOffRequest')}
      </h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('ess.requests.timeOffType')}
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="half_day">{t('ess.requests.timeOffTypeHalfDay')}</option>
            <option value="few_hours">{t('ess.requests.timeOffTypeFewHours')}</option>
            <option value="emergency">{t('ess.requests.timeOffTypeEmergency')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('ess.requests.date')}
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            required
          />
        </div>
        {formData.type === 'few_hours' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('ess.attendance.hours')}
            </label>
            <input
              type="number"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              min="1"
              max="8"
              required
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('ess.requests.reason')}
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            rows={3}
            required
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {t('ess.requests.submit')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium"
          >
            {t('ess.requests.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}

interface HRInfoRequestFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

function HRInfoRequestForm({ onClose, onSubmit }: HRInfoRequestFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('ess.requests.newHRInfoRequest')}
      </h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('ess.requests.subject')}
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('ess.requests.message')}
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            rows={5}
            required
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {t('ess.requests.submit')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium"
          >
            {t('ess.requests.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
