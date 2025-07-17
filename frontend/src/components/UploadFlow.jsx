import React, { useState, useEffect } from 'react';
import {
    Upload,
    FileText,
    CheckCircle2,
    AlertCircle,
    Search,
    Filter,
    Zap,
    BarChart3,
    Loader2,
    ChevronRight,
    X,
    Shield,
    Server,
    Activity,
    FileSearch,
    RefreshCw
} from 'lucide-react';

import { dashboardApi } from '../services/dashboardApi';
import api from '../services/api';

const UploadFlow = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedTool, setSelectedTool] = useState(null);
    const [file, setFile] = useState(null);
    const [tools, setTools] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [processingStatus, setProcessingStatus] = useState('idle');
    const [uploadResult, setUploadResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch tools from API
    useEffect(() => {
        const fetchTools = async () => {
            try {
                const data = await dashboardApi.getAllTools()

                // Map tools to include icons and colors based on type
                const mappedTools = data.map(tool => {
                    let icon = Shield;
                    let color = 'blue';

                    const toolType = tool.type.toLowerCase();
                    const toolName = tool.name.toLowerCase();

                    if (toolType.includes('vulnerability') || toolName.includes('nessus') || toolName.includes('openvas')) {
                        icon = FileSearch;
                        color = toolName.includes('nessus') ? 'blue' : 'green';
                    } else if (toolType.includes('firewall') || toolName.includes('fortinet') || toolName.includes('palo')) {
                        icon = Server;
                        color = toolName.includes('fortinet') ? 'red' : 'orange';
                    } else if (toolType.includes('antivirus') || toolName.includes('sophos')) {
                        icon = Shield;
                        color = 'purple';
                    } else if (toolType.includes('waf')) {
                        icon = Activity;
                        color = 'blue';
                    }

                    return {
                        ...tool,
                        icon,
                        color,
                        description: tool.vendor ? `${tool.type} by ${tool.vendor}` : tool.type
                    };
                });

                setTools(mappedTools);
            } catch (error) {
                console.error('Failed to fetch tools:', error);
                // Fallback to some default tools if API fails
                setTools([
                    { id: 1, name: 'Nessus', category: 'vulnerability_scanner', icon: Shield, description: 'Vulnerability Scanner', color: 'blue' },
                    { id: 2, name: 'Fortinet', category: 'firewall', icon: Server, description: 'Firewall', color: 'red' },
                ]);
            }
        };

        if (isOpen) {
            fetchTools();
            setCurrentStep(1);
            setSelectedTool(null);
            setFile(null);
            setSearchQuery('');
            setSelectedCategory('all');
            setIsLoading(false);
            setUploadProgress(0);
            setProcessingStatus('idle');
            setUploadResult(null);
            setErrorMessage('');
        }
    }, [isOpen]);

    const steps = [
        { id: 1, title: 'Select Tool', icon: Shield, description: 'Choose your security tool' },
        { id: 2, title: 'Upload File', icon: Upload, description: 'Upload log file' },
        { id: 3, title: 'Processing', icon: Zap, description: 'Parsing your data' },
        { id: 4, title: 'Complete', icon: BarChart3, description: 'View KPIs' }
    ];

    const categories = [
        { id: 'all', name: 'All Tools', count: tools.length },
        { id: 'vulnerability scanner', name: 'Vulnerability Scanners', count: tools.filter(t => t.type?.toLowerCase().includes('vulnerability')).length },
        { id: 'firewall', name: 'Firewalls', count: tools.filter(t => t.type?.toLowerCase().includes('firewall')).length },
        { id: 'waf', name: 'WAF', count: tools.filter(t => t.type?.toLowerCase().includes('waf')).length },
        { id: 'antivirus', name: 'Antivirus', count: tools.filter(t => t.type?.toLowerCase().includes('antivirus')).length },
        { id: 'web application scanner', name: 'Application Scanner', count: tools.filter(t => t.type?.toLowerCase().includes('web application')).length },
        { id: 'patch management', name: 'Patch Management', count: tools.filter(t => t.type?.toLowerCase().includes('patch')).length }
    ];

    const filteredTools = tools.filter(tool => {
        const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' ||
            tool.type?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
            tool.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleFileSelect = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        setIsLoading(true);
        setProcessingStatus('uploading');
        setUploadProgress(0);
        setErrorMessage('');

        try {
            // Create FormData
            const formData = new FormData();
            formData.append('file', file);

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            console.log('uploading')

            // Upload file
            const response = await api.post(`api/dashboard/files/upload?tool_id=${selectedTool.id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / (progressEvent.total || 1)
                    );
                    setUploadProgress(Math.min(percentCompleted, 90));
                }
            });

            console.log(response);

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (response.status >= 400) {
                const errorData = response.data?.detail || response.data?.message || 'Upload failed';
                throw new Error(typeof errorData === 'string' ? errorData : JSON.stringify(errorData));
            }
            const result = response.data;
            setUploadResult(result);

            // Move to parsing phase
            setProcessingStatus('parsing');

            // Poll for file processing status
            let attempts = 0;
            const maxAttempts = 30;
            const pollInterval = setInterval(async () => {
                attempts++;

                try {
                    const statusResponse = await api.get(`/api/dashboard/files/${result.id}`);
                    if (!statusResponse.statusText === "OK") throw new Error('Failed to check status');
                    const fileStatus = statusResponse.data;
                    console.log('f: ', fileStatus);
                    if (fileStatus.status === "processed") {
                        clearInterval(pollInterval);
                        setProcessingStatus('calculating');

                        // Wait a bit to show calculation phase
                        setTimeout(() => {
                            setProcessingStatus('complete');
                            setCurrentStep(4);
                            setIsLoading(false);
                        }, 2000);
                    } else if (fileStatus.status === 'failed' || attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        throw new Error('Processing failed');
                    }
                } catch (error) {
                    clearInterval(pollInterval);
                    console.error('Status check error:', error);
                    setProcessingStatus('failed');
                    setIsLoading(false);
                }
            }, 2000);

        } catch (error) {
            console.error('Upload error:', error);
            setProcessingStatus('failed');
            setIsLoading(false);

            const extractErrorMessage = (error) => {
                if (!error.response) return error.message;

                const { data } = error.response;
                if (Array.isArray(data?.detail)) {
                    return data.detail[0]?.msg || 'Validation error';
                }
                return data?.detail || data?.message || 'Request failed';
            };

            setErrorMessage(extractErrorMessage(error));
        }
    };

    const getStepStatus = (stepId) => {
        if (stepId < currentStep) return 'completed';
        if (stepId === currentStep) return 'active';
        return 'pending';
    };

    const getToolColorClasses = (color) => {
        const colors = {
            blue: 'bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200',
            red: 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200',
            green: 'bg-green-100 text-green-600 border-green-200 hover:bg-green-200',
            purple: 'bg-purple-100 text-purple-600 border-purple-200 hover:bg-purple-200',
            orange: 'bg-orange-100 text-orange-600 border-orange-200 hover:bg-orange-200'
        };
        return colors[color] || colors.blue;
    };

    const handleRetry = () => {
        setProcessingStatus('idle');
        setUploadProgress(0);
        setErrorMessage('');
        handleUpload();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold">Security Report Upload</h2>
                            <p className="text-blue-100 mt-1">Process your security logs in 4 simple steps</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Steps Progress Bar */}
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                            const status = getStepStatus(step.id);
                            const Icon = step.icon;

                            return (
                                <div key={step.id} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center">
                                        <div className={`
                                            w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                                            ${status === 'completed' ?
                                                'bg-white text-blue-600'
                                                : status === 'active' ?
                                                    'bg-white/20 text-white ring-4 ring-white/40'
                                                    : 'bg-white/10 text-white/50'}
                                            `}>
                                            {status === 'completed' ? (
                                                <CheckCircle2 className="w-6 h-6" />
                                            ) : (
                                                <Icon className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div className="mt-2 text-center">
                                            <p className={`text-sm font-medium ${status === 'pending' ? 'text-white/50' : 'text-white'}`}>
                                                {step.title}
                                            </p>
                                            <p className={`text-xs ${status === 'pending' ? 'text-white/30' : 'text-blue-100'}`}>
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className="flex-1 mx-4">
                                            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full bg-white transition-all duration-500 ${status === 'completed' ? 'w-full' : 'w-0'
                                                        }`}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                    {/* Step 1: Select Tool */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            {/* Search and Filter Bar */}
                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search tools by name or description..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Filter className="w-5 h-5 text-gray-500" />
                                    <span className="text-sm text-gray-600">Filter:</span>
                                </div>
                            </div>

                            {/* Category Tabs */}
                            <div className="flex space-x-2 overflow-x-auto pb-2">
                                {categories.map(category => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                      ${selectedCategory === category.id
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {category.name} ({category.count})
                                    </button>
                                ))}
                            </div>

                            {/* Tools Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredTools.map(tool => {
                                    const Icon = tool.icon;
                                    const isSelected = selectedTool?.id === tool.id;

                                    return (
                                        <button
                                            key={tool.id}
                                            onClick={() => setSelectedTool(tool)}
                                            className={`p-4 rounded-xl border-2 transition-all duration-200 text-left
                                                ${isSelected
                                                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}`}
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getToolColorClasses(tool.color)}`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                                                    <p className="text-sm text-gray-500 mt-1">{tool.description}</p>
                                                </div>
                                                {isSelected && (
                                                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Next Button */}
                            <div className="flex justify-end pt-4 pb-4">
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    disabled={!selectedTool}
                                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2
                                        ${selectedTool
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                >
                                    <span>Continue</span>
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Upload File */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            {/* Selected Tool Display */}
                            <div className="bg-gray-50 rounded-xl p-4 flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getToolColorClasses(selectedTool.color)}`}>
                                    <selectedTool.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Selected Tool</p>
                                    <p className="font-semibold text-gray-900">{selectedTool.name}</p>
                                </div>
                            </div>

                            {/* Upload Area */}
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                                <input
                                    type="file"
                                    id="file-upload"
                                    onChange={handleFileSelect}
                                    accept=".xml,.txt,.json,.csv,.log"
                                    className="hidden"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-lg font-medium text-gray-700 mb-2">
                                        {file ? file.name : 'Drop your file here or click to browse'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Supported formats: XML, TXT, JSON, CSV, LOG
                                    </p>
                                    {file && (
                                        <div className="mt-4 inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-700">
                                                {(file.size / 1024).toFixed(2)} KB
                                            </span>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {/* File Requirements */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-start space-x-2">
                                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h3 className="text-sm font-medium text-blue-900">File Requirements</h3>
                                        <ul className="text-sm text-blue-700 mt-1 space-y-1">
                                            <li>• Maximum file size: 100MB</li>
                                            <li>• Ensure the file matches the selected tool format</li>
                                            <li>• Files are processed securely and deleted after analysis</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-between pb-4">
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className="px-6 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => {
                                        setCurrentStep(3);
                                        handleUpload();
                                    }}
                                    disabled={!file}
                                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2
                                        ${file
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                >
                                    <span>Upload & Process</span>
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Processing */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="text-center py-12">
                                {/* Processing Animation - Updated with error state */}
                                <div className="relative w-32 h-32 mx-auto mb-8">
                                    {processingStatus !== 'failed' ? (
                                        <>
                                            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping"></div>
                                            <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping animation-delay-200"></div>
                                            <div className="relative bg-white rounded-full w-32 h-32 flex items-center justify-center shadow-lg">
                                                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="relative bg-white rounded-full w-32 h-32 flex items-center justify-center shadow-lg border-2 border-red-500">
                                            <AlertCircle className="w-12 h-12 text-red-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Status Messages - Updated with error state */}
                                <div className="space-y-4">
                                    {/* Upload Progress */}
                                    <div className={`transition-all duration-500 ${processingStatus === 'uploading' || processingStatus === 'failed' ?
                                        'opacity-100' : 'opacity-50'
                                        }`}>
                                        <div className="flex items-center justify-center space-x-2 mb-2">
                                            {processingStatus === 'uploading' ? (
                                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                            ) : uploadProgress === 100 ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            ) : processingStatus === 'failed' ? (
                                                <AlertCircle className="w-5 h-5 text-red-600" />
                                            ) : null}
                                            <span className="font-medium text-gray-900">
                                                {processingStatus === 'failed' ? 'Upload Failed' : 'Uploading File'}
                                            </span>
                                        </div>
                                        <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${processingStatus === 'failed' ?
                                                    'bg-red-600' : 'bg-blue-600'
                                                    }`}
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Parsing Status */}
                                    <div className={`transition-all duration-500 ${processingStatus === 'parsing' ? 'opacity-100' :
                                        ['calculating', 'complete'].includes(processingStatus) ? 'opacity-50' :
                                            processingStatus === 'failed' ? 'opacity-30' : 'opacity-30'
                                        }`}>
                                        <div className="flex items-center justify-center space-x-2">
                                            {processingStatus === 'parsing' ? (
                                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                            ) : ['calculating', 'complete'].includes(processingStatus) ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            ) : processingStatus === 'failed' ? (
                                                <div className="w-5 h-5" /> // Empty space for alignment
                                            ) : (
                                                <div className="w-5 h-5" />
                                            )}
                                            <span className="font-medium text-gray-900">Parsing Security Data</span>
                                        </div>
                                    </div>

                                    {/* KPI Calculation Status */}
                                    <div className={`transition-all duration-500 ${processingStatus === 'calculating' ? 'opacity-100' :
                                        processingStatus === 'complete' ? 'opacity-50' :
                                            processingStatus === 'failed' ? 'opacity-30' : 'opacity-30'
                                        }`}>
                                        <div className="flex items-center justify-center space-x-2">
                                            {processingStatus === 'calculating' ? (
                                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                            ) : processingStatus === 'complete' ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            ) : processingStatus === 'failed' ? (
                                                <div className="w-5 h-5" /> // Empty space for alignment
                                            ) : (
                                                <div className="w-5 h-5" />
                                            )}
                                            <span className="font-medium text-gray-900">Calculating KPIs</span>
                                        </div>
                                    </div>

                                    {/* Error Message Display */}
                                    {processingStatus === 'failed' && (
                                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-left">
                                            <div className="flex items-start space-x-2">
                                                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-medium text-red-800">Processing Error</p>
                                                    <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Processing Message */}
                                <p className="text-gray-600 mt-8">
                                    {processingStatus === 'uploading' && 'Securely uploading your file...'}
                                    {processingStatus === 'parsing' && 'Analyzing security data patterns...'}
                                    {processingStatus === 'calculating' && 'Computing performance metrics...'}
                                    {processingStatus === 'failed' && 'An error occurred during processing'}
                                </p>

                                {/* Action Buttons - Added retry option */}
                                <div className="flex justify-center space-x-4 mt-8">
                                    <button
                                        onClick={() => {
                                            setCurrentStep(1);
                                            setProcessingStatus('idle');
                                            setUploadProgress(0);
                                            setErrorMessage('');
                                        }}
                                        className="px-6 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                    >
                                        Start Over
                                    </button>

                                    {processingStatus === 'failed' && (
                                        <button
                                            onClick={handleRetry}
                                            className="px-6 py-3 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-lg transition-all duration-200 flex items-center space-x-2"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                            <span>Try Again</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Complete */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Processing Complete!</h3>
                                <p className="text-gray-600">Your security report has been successfully analyzed</p>
                            </div>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-blue-600">247</p>
                                    <p className="text-sm text-gray-600 mt-1">Findings Processed</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-red-600">12</p>
                                    <p className="text-sm text-gray-600 mt-1">Critical Issues</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-green-600">8</p>
                                    <p className="text-sm text-gray-600 mt-1">KPIs Updated</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        onClose();
                                        // Navigate to dashboard
                                    }}
                                    className="px-6 py-3 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-lg transition-all duration-200 flex items-center space-x-2"
                                >
                                    <span>View Dashboard</span>
                                    <BarChart3 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadFlow;