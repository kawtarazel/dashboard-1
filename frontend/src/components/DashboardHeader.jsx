import { useState, useRef, useEffect } from 'react';
import { Search, Download, Upload, Moon, Sun, ChevronDown, X, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';

function DashboardHeader({ setSwitch, setActiveItem }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [file, setFile] = useState(null);
  const [tools, setTools] = useState([]);
  const [selectedTool, setSelectedTool] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { user, logout } = useAuth();
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Fetch tools when upload modal opens
  useEffect(() => {
    if (isUploadModalOpen) {
      fetchTools();
    }
  }, [isUploadModalOpen]);

  const fetchTools = async () => {
    try {
      const response = await api.get('/api/dashboard/tools');
      setTools(response.data);
    } catch (error) {
      toast.error('Failed to fetch tools');
    }
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['.xml', '.txt', '.json', '.csv', '.nessus', '.log'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(fileExtension)) {
        toast.error('Please select a valid file type (XML, TXT, JSON, CSV, LOG)');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    
    if (!file || !selectedTool) {
      toast.error('Please select both a file and a tool');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(`/api/dashboard/files/upload?tool_id=${selectedTool}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('🎉 File uploaded successfully! Processing started...');
      
      // Reset form
      setFile(null);
      setSelectedTool('');
      setIsUploadModalOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to upload file';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setFile(null);
    setSelectedTool('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CybrSense
            </h1>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 transition-all duration-200"
              />
            </div>

            {/* Download Button */}
            <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
              <Download className="w-5 h-5" />
            </button>

            {/* Upload Button */}
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200"
            >
              <Upload className="w-5 h-5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all duration-200"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* User Profile */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-gray-700 font-medium text-sm">
                  {user?.username || 'User'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Profile
                  </a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Settings
                  </a>
                  {user?.is_superuser && (
                    <a
                      onClick={() => {
                        setSwitch(true);
                        setActiveItem(0);
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      Manage Users
                    </a>
                  )}
                  <hr className="my-2" />
                  <button
                    onClick={() => {
                      logout();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Upload Security Report</h2>
              </div>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  resetUploadForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleUpload} className="p-6 space-y-6">
              {/* Tool Selection */}
              <div>
                <label htmlFor="tool" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Analysis Tool
                </label>
                <select
                  id="tool"
                  value={selectedTool}
                  onChange={(e) => setSelectedTool(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all duration-200"
                  required
                >
                  <option value="">Choose a tool...</option>
                  {tools.map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.name} - {tool.type}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload */}
              <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Report File
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file"
                    onChange={handleFileSelect}
                    accept=".xml,.txt,.json,.csv"
                    className="hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <FileText className="w-5 h-5" />
                    <span>{file ? file.name : 'Click to select file'}</span>
                  </button>
                </div>
                {file && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>File selected: {file.name}</span>
                  </div>
                )}
              </div>

              {/* File Type Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Supported File Types</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      XML, TXT, JSON, CSV files from security tools like Nessus, OpenVAS, etc.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    resetUploadForm();
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !file || !selectedTool}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload & Process</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default DashboardHeader;