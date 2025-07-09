import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Clock, CheckCircle, AlertCircle, Upload, Eye, Download } from 'lucide-react';
import api from '../../services/api';

const FilesPage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/dashboard/files');
      setFiles(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch files');
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    // Set up polling for status updates
    // const interval = setInterval(fetchFiles, 10000); // Poll every 10 seconds
    // return () => clearInterval(interval);
  }, []);

  const getStatusInfo = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="w-4 h-4" />,
          label: 'Processing'
        };
      case 'processed':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Completed'
        };
              case 'failed':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertCircle className="w-4 h-4" />,
          label: 'Failed'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <FileText className="w-4 h-4" />,
          label: 'Unknown'
        };
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3 text-red-600">
          <AlertCircle className="w-6 h-6" />
          <span className="font-medium">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">File Management</h1>
            <p className="text-gray-600">
              View and manage your uploaded security reports. Use the upload button in the header to add new files.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              <span className="font-medium">{files.length}</span> files uploaded
            </div>
            <div className="flex items-center space-x-2 text-blue-600">
              <Upload className="w-5 h-5" />
              <span className="text-sm font-medium">Upload in header</span>
            </div>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {files.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded yet</h3>
            <p className="text-gray-600 mb-4">
              Start by uploading a security report using the upload button in the header
            </p>
            <div className="inline-flex items-center space-x-2 text-blue-600">
              <Upload className="w-5 h-5" />
              <span className="font-medium">Click the upload button above</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => {
                  const statusInfo = getStatusInfo(file.status);
                  return (
                    <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {file.filename}
                            </div>
                            <div className="text-sm text-gray-500">
                              {file.file_type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(file.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatFileSize(file.size)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                          {statusInfo.icon}
                          <span className="ml-1">{statusInfo.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              // Navigate to file details or logs
                              console.log('View file details:', file.id);
                            }}
                            className="text-blue-600 hover:text-blue-700 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {file.status === 'processed' && (
                            <button
                              onClick={() => {
                                // Download or export functionality
                                console.log('Download file:', file.id);
                              }}
                              className="text-green-600 hover:text-green-700 p-1 rounded-lg hover:bg-green-50 transition-colors"
                              title="Download Results"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {files.length}
                </div>
                <div className="text-sm text-gray-600">Total Files</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {files.filter(f => f.status === 'processed').length}
                </div>
                <div className="text-sm text-gray-600">Processed</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {files.filter(f => f.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Processing</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesPage;