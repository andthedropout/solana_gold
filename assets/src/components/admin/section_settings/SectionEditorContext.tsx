import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SectionEditorContextType {
  isEditing: boolean;
  editingSectionId: string | null;
  editingComponentType: string | null;
  openSectionEditor: (sectionId: string, componentType: string) => void;
  closeSectionEditor: () => void;
}

const SectionEditorContext = createContext<SectionEditorContextType | undefined>(undefined);

export const useSectionEditor = () => {
  const context = useContext(SectionEditorContext);
  if (context === undefined) {
    throw new Error('useSectionEditor must be used within a SectionEditorProvider');
  }
  return context;
};

interface SectionEditorProviderProps {
  children: ReactNode;
}

export const SectionEditorProvider: React.FC<SectionEditorProviderProps> = ({ children }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingComponentType, setEditingComponentType] = useState<string | null>(null);

  const openSectionEditor = (sectionId: string, componentType: string) => {
    setEditingSectionId(sectionId);
    setEditingComponentType(componentType);
    setIsEditing(true);
  };

  const closeSectionEditor = () => {
    setIsEditing(false);
    setEditingSectionId(null);
    setEditingComponentType(null);
  };

  const value = {
    isEditing,
    editingSectionId,
    editingComponentType,
    openSectionEditor,
    closeSectionEditor,
  };

  return (
    <SectionEditorContext.Provider value={value}>
      {children}
    </SectionEditorContext.Provider>
  );
}; 