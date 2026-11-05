'use client';

import Folder from './Folder';
import { projects } from '../lib/content';
import './ProjectFolderCollection.css';

const groups = [
  { title: 'Games', projects: projects.filter(project => project.collection === 'Games') },
  { title: 'Special Initiatives', projects: projects.filter(project => project.collection === 'Special Initiatives') }
];

export default function ProjectFolderCollection({ compact = false }) {
  return <div className={`kk-folder-collections${compact ? ' kk-folder-collections--compact' : ''}`}>
    {groups.map((group, index) => <section className="kk-folder-collection" key={group.title} aria-label={group.title}>
      {!compact && <div className="kk-folder-heading"><span>0{index + 1} / COLLECTION</span><h2>{group.title}</h2><p>{group.projects.length} {group.projects.length === 1 ? 'project' : 'projects'}</p></div>}
      <div className="kk-folder-art">
        <Folder
          mode="flap"
          variant="matte"
          layout="spread"
          color="#363638"
          paperColor="#f4eee2"
          label={group.title}
          items={group.projects.map(project => ({ image: project.image, title: project.title, alt: project.imageAlt }))}
          onItemClick={(_, itemIndex) => {
            const destination = `/projects/${group.projects[itemIndex].slug}`;
            window.setTimeout(() => { window.location.href = destination; }, 450);
          }}
          tabPosition="right"
          openOn="click"
          size={compact ? 0.94 : 1.12}
          frost={0.25}
          tilt={0.5}
          speed={1}
          bounce={0.4}
          peek
          intro
          draggable
          zoomOnClick
          theme="dark"
        />
      </div>
      {compact && <div className="kk-folder-heading kk-folder-heading--below"><span>0{index + 1} / COLLECTION</span><h2>{group.title}</h2></div>}
    </section>)}
  </div>;
}
