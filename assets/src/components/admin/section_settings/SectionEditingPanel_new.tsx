// Just use the static mappings directly - no async needed
const loadSectionSchema = (componentType: string) => {
  console.log(`Loading schema for: ${componentType}`);
  
  const schema = SCHEMA_MAP[componentType as keyof typeof SCHEMA_MAP];
  
  if (!schema) {
    console.warn(`No schema found for component type: ${componentType}`);
    console.log(`Available schemas:`, Object.keys(SCHEMA_MAP));
    return null;
  }
  
  console.log(`✅ Found schema for ${componentType}`);
  return schema;
};

const loadSectionDefaultContent = (componentType: string) => {
  console.log(`Loading default content for: ${componentType}`);
  
  const defaultContent = DEFAULT_CONTENT_MAP[componentType as keyof typeof DEFAULT_CONTENT_MAP];
  
  if (!defaultContent) {
    console.warn(`No default content found for component type: ${componentType}`);
    console.log(`Available default content:`, Object.keys(DEFAULT_CONTENT_MAP));
    return null;
  }
  
  console.log(`✅ Found default content for ${componentType}`);
  return defaultContent;
};