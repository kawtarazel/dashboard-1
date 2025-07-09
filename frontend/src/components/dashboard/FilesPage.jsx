import React from 'react';
import FileUpload from './FileUpload';
import FileList from './FileList';

const FilesPage = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <FileUpload />
        <FileList />
      </div>
    </div>
  );
};

export default FilesPage;
