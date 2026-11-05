import React from 'react';
import { createRoot } from 'react-dom/client';
import ProjectFolderCollection from '../components/ProjectFolderCollection';

const mount = document.getElementById('project-folder-root');
if (mount) createRoot(mount).render(<ProjectFolderCollection compact />);
