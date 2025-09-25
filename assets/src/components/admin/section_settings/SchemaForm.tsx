import React from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import { ResponsivePaddingForm } from '.';
import { ImageUpload } from '@/components/ui/image-upload';

interface SchemaFormProps {
  schema: z.ZodType;
  values: any;
  onChange: (values: any) => void;
}

export const SchemaForm: React.FC<SchemaFormProps> = ({ schema, values, onChange }) => {
  
  const renderField = (key: string, fieldSchema: z.ZodType, currentValue: any, path: string[] = []) => {
    const fieldPath = [...path, key].join('.');
    const fullPath = path.length > 0 ? `${path.join('.')}.${key}` : key;
    
    const updateValue = (newValue: any) => {
      const updatedValues = { ...values };
      let current = updatedValues;
      
      // Navigate to the nested object/array, creating objects/arrays if they don't exist
      for (let i = 0; i < path.length; i++) {
        const pathKey = path[i];
        const isArrayIndex = !isNaN(Number(pathKey));
        
        if (isArrayIndex) {
          // Handle array index
          if (!Array.isArray(current)) {
            current = [];
          }
          const index = Number(pathKey);
          if (!current[index]) {
            current[index] = {};
          }
          current = current[index];
        } else {
          // Handle object key
          if (!current[pathKey]) {
            current[pathKey] = {};
          }
          current = current[pathKey];
        }
      }
      
      current[key] = newValue;
      onChange(updatedValues);
    };

    // Handle ZodArray (dynamic arrays)
    if (fieldSchema instanceof z.ZodArray) {
      const itemSchema = fieldSchema._def.type;
      const currentArray = currentValue || [];
      const arrayTitle = key.replace(/([A-Z])/g, ' $1').trim();
      
      // Get max length from Zod validation (default to 400 when no explicit max)
      const checks = (fieldSchema as any)._def?.checks || [];
      const maxCheck = checks.find((c: any) => c.kind === 'max');
      
      // Also check if max is stored in other locations for ZodArray
      const maxLength = (fieldSchema as any)._def?.maxLength;
      const exactLength = (fieldSchema as any)._def?.exactLength;
      
      const maxItems = maxCheck?.value || maxLength?.value || exactLength?.value || 400;
      
      const addItem = () => {
        if (currentArray.length >= maxItems) return;
        
        // Create default item based on schema type
        let defaultItem: any;
        
        // Handle string arrays (like listItems)
        if (itemSchema instanceof z.ZodString) {
          defaultItem = `New ${arrayTitle.slice(0, -1).toLowerCase()} ${currentArray.length + 1}`;
        } else if (itemSchema instanceof z.ZodObject) {
          // Handle object arrays (like features)
          defaultItem = {};
          const shape = itemSchema.shape;
          const itemCount = currentArray.length;
          
          Object.keys(shape).forEach(itemKey => {
            const itemFieldSchema = shape[itemKey];
            if (itemFieldSchema instanceof z.ZodString) {
              // Provide better defaults for common field names
              if (itemKey === 'title') {
                defaultItem[itemKey] = `New ${arrayTitle.slice(0, -1)} ${itemCount + 1}`;
              } else if (itemKey === 'description') {
                defaultItem[itemKey] = `Description for ${arrayTitle.slice(0, -1).toLowerCase()} ${itemCount + 1}`;
              } else if (itemKey === 'alt') {
                defaultItem[itemKey] = `${arrayTitle.slice(0, -1)} ${itemCount + 1}`;
              } else {
                defaultItem[itemKey] = '';
              }
            } else if (itemFieldSchema instanceof z.ZodNumber) {
              defaultItem[itemKey] = 0;
            } else if (itemFieldSchema instanceof z.ZodArray) {
              // Default list items for features
              if (itemKey === 'listItems') {
                defaultItem[itemKey] = [
                  'Key benefit or feature',
                  'Another important point',
                  'Third compelling reason'
                ];
              } else {
                defaultItem[itemKey] = [];
              }
            } else if (itemFieldSchema instanceof z.ZodObject) {
              defaultItem[itemKey] = {};
            } else if (itemFieldSchema instanceof z.ZodDefault) {
              defaultItem[itemKey] = itemFieldSchema._def.defaultValue();
            } else if (itemFieldSchema instanceof z.ZodEnum) {
              // Use first enum option as default
              const options = (itemFieldSchema as any).options;
              defaultItem[itemKey] = options[0];
            }
          });
          
          // Special handling for nested objects like image
          if (defaultItem.image && typeof defaultItem.image === 'object') {
            // Get the height default from the schema
            let heightDefault = 160; // fallback
            const imageSchema = shape.image;
            if (imageSchema instanceof z.ZodObject) {
              const heightField = imageSchema.shape.height;
              if (heightField instanceof z.ZodDefault) {
                heightDefault = heightField._def.defaultValue();
              }
            }
            
            defaultItem.image = {
              url: '',
              alt: defaultItem.title || `${arrayTitle.slice(0, -1)} ${itemCount + 1}`,
              height: heightDefault
            };
          }
        } else {
          // Fallback for other types
          defaultItem = '';
        }
        
        updateValue([...currentArray, defaultItem]);
      };
      
      const removeItem = (index: number) => {
        const newArray = currentArray.filter((_: any, i: number) => i !== index);
        updateValue(newArray);
      };
      
      const moveItem = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= currentArray.length) return;
        const newArray = [...currentArray];
        const [moved] = newArray.splice(fromIndex, 1);
        newArray.splice(toIndex, 0, moved);
        updateValue(newArray);
      };
      
      const updateItem = (index: number, itemValue: any) => {
        const newArray = [...currentArray];
        newArray[index] = itemValue;
        updateValue(newArray);
      };

      return (
        <div key={fullPath} className="col-span-full">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value={fullPath} className="border-0">
              <div className="border rounded-md bg-muted/20">
                <AccordionTrigger className="px-3 py-2 hover:no-underline border-0 [&[data-state=open]>svg]:rotate-180">
                  <div className="flex items-center justify-between w-full pr-2">
                    <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
                      {arrayTitle} ({currentArray.length}/{maxItems})
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 pt-0 border-0">
                  <div className="space-y-3">
                    {currentArray.map((item: any, index: number) => (
                      <div key={`${fullPath}-${index}`} className="border rounded-md bg-background/50">
                        {itemSchema instanceof z.ZodString ? (
                          // Simple text input for string arrays
                                                     <div className="flex items-center gap-2 p-3">
                             <div
                               className="h-5 w-5 p-0 rounded text-red-500 hover:text-red-600 hover:bg-muted-foreground/10 cursor-pointer flex items-center justify-center transition-colors"
                               onClick={() => removeItem(index)}
                               title="Remove"
                             >
                               <X className="h-3 w-3" />
                             </div>
                             <Input
                               value={typeof item === 'string' ? item : ''}
                               onChange={(e) => updateItem(index, e.target.value)}
                               className="h-8 text-sm flex-1"
                               placeholder={`${arrayTitle.slice(0, -1)} ${index + 1}`}
                             />
                           </div>
                        ) : (
                          // Accordion for object arrays
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value={`${fullPath}-item-${index}`} className="border-0">
                              <AccordionTrigger className="px-3 py-2 hover:no-underline border-0 [&[data-state=open]>svg]:rotate-180">
                                <div className="flex items-center justify-between w-full pr-2">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {arrayTitle.slice(0, -1)} {index + 1}
                                    {item.title && `: ${item.title.slice(0, 30)}${item.title.length > 30 ? '...' : ''}`}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {index > 0 && (
                                      <div
                                        className="h-5 w-5 p-0 rounded hover:bg-muted-foreground/10 cursor-pointer flex items-center justify-center transition-colors"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          moveItem(index, index - 1);
                                        }}
                                        title="Move up"
                                      >
                                        <ChevronUp className="h-3 w-3" />
                                      </div>
                                    )}
                                    {index < currentArray.length - 1 && (
                                      <div
                                        className="h-5 w-5 p-0 rounded hover:bg-muted-foreground/10 cursor-pointer flex items-center justify-center transition-colors"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          moveItem(index, index + 1);
                                        }}
                                        title="Move down"
                                      >
                                        <ChevronDown className="h-3 w-3" />
                                      </div>
                                    )}
                                    <div
                                      className="h-5 w-5 p-0 rounded text-red-500 hover:text-red-600 hover:bg-muted-foreground/10 cursor-pointer flex items-center justify-center transition-colors"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        removeItem(index);
                                      }}
                                      title="Remove"
                                    >
                                      <X className="h-3 w-3" />
                                    </div>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-3 pb-3 pt-0 border-0">
                                <div className="grid gap-3 mt-1" style={{
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))'
                                }}>
                                  {itemSchema instanceof z.ZodObject && Object.entries(itemSchema.shape).map(([itemKey, itemFieldSchema]) =>
                                    renderField(itemKey, itemFieldSchema as z.ZodType, item?.[itemKey], [...path, key, index.toString()])
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                      </div>
                    ))}
                    
                    {currentArray.length < maxItems && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addItem}
                        className="w-full mt-3 border-dashed"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add {arrayTitle.slice(0, -1)}
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      );
    }

    // Handle ZodObject (nested objects)
    if (fieldSchema instanceof z.ZodObject) {
      const shape = fieldSchema.shape;
      const groupTitle = key.replace(/([A-Z])/g, ' $1').trim();
      
      // Special handling for sectionPadding - use ResponsivePaddingForm
      if (key === 'sectionPadding') {
        return (
          <div key={fullPath} className="col-span-full">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value={fullPath} className="border-0">
                <div className="border rounded-md bg-muted/20">
                  <AccordionTrigger className="px-3 py-2 hover:no-underline border-0 [&[data-state=open]>svg]:rotate-180">
                    <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
                      {groupTitle}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3 pt-0 border-0">
                    <ResponsivePaddingForm
                      values={currentValue || { 
                        mobile: { top: 0, bottom: 0, horizontal: 16 },
                        tablet: { top: 0, bottom: 0, horizontal: 24 },
                        desktop: { top: 0, bottom: 0, horizontal: 32 }
                      }}
                      onChange={updateValue}
                    />
                  </AccordionContent>
                </div>
              </AccordionItem>
            </Accordion>
          </div>
        );
      }
      
      // Check if this is a CTA section, feature, or stat that should have a visibility toggle
      const isCTASection = key === 'primaryCta' || key === 'secondaryCta' || key === 'cta' || key === 'topButton' || key === 'featureCta' ||
                           key === 'stat1' || key === 'stat2' || key === 'stat3' || key === 'stat4' ||
                           key === 'topElement' || key === 'bottomElement' || key === 'reviews';
      const isVisible = isCTASection ? currentValue?.visible !== false : true;
      
      const toggleVisibility = () => {
        if (isCTASection) {
          const newValue = { ...currentValue, visible: !isVisible };
          updateValue(newValue);
        }
      };

      return (
        <div key={fullPath} className="col-span-full">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value={fullPath} className="border-0">
              <div className="border rounded-md bg-muted/20">
                <AccordionTrigger className="px-3 py-2 hover:no-underline border-0 [&[data-state=open]>svg]:rotate-180">
                  <div className="flex items-center justify-between w-full pr-2">
                    <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
                      {groupTitle}
                    </span>
                    {isCTASection && (
                      <div
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleVisibility();
                        }}
                        className="h-6 w-6 p-1 ml-2 rounded hover:bg-muted-foreground/10 cursor-pointer flex items-center justify-center transition-colors"
                        title={isVisible ? 'Hide button' : 'Show button'}
                      >
                        {isVisible ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3 opacity-50" />
                        )}
                      </div>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 pt-0 border-0">
                  <div className="grid gap-3 mt-1" style={{
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))'
                  }}>
                    {Object.entries(shape)
                      .filter(([nestedKey]) => nestedKey !== 'visible')
                      .map(([nestedKey, nestedSchema]) =>
                        renderField(nestedKey, nestedSchema as z.ZodType, currentValue?.[nestedKey], [...path, key])
                      )}
                  </div>
                </AccordionContent>
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      );
    }

    // Handle ZodEnum (select dropdowns)
    if (fieldSchema instanceof z.ZodEnum) {
      const options = fieldSchema.options;
      return (
        <div key={fullPath} className="space-y-1">
          <Label htmlFor={fullPath} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </Label>
          <Select value={currentValue || ''} onValueChange={updateValue}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: string) => (
                <SelectItem key={option} value={option} className="text-sm">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Handle ZodOptional (unwrap to get the inner type)
    if (fieldSchema instanceof z.ZodOptional) {
      return renderField(key, fieldSchema._def.innerType, currentValue, path);
    }

    // Handle ZodDefault (unwrap to get the inner type)
    if (fieldSchema instanceof z.ZodDefault) {
      return renderField(key, fieldSchema._def.innerType, currentValue, path);
    }

    // Handle ZodString
    if (fieldSchema instanceof z.ZodString) {
      const isTextarea = key.toLowerCase().includes('subtitle') || 
                         key.toLowerCase().includes('description') ||
                         key.toLowerCase().includes('content');
      
      const isColor = key.toLowerCase().includes('color');
      const fullFieldPath = [...path, key].join('.');
      const isImage = (key.toLowerCase().includes('image') && !key.toLowerCase().includes('alt')) || 
                      (fullFieldPath.toLowerCase().includes('image') && key.toLowerCase() === 'url') ||
                      (fullFieldPath.toLowerCase().includes('avatar') && key.toLowerCase() === 'url') ||
                      (fullFieldPath.toLowerCase().includes('logo') && key.toLowerCase() === 'url');

      return (
        <div key={fullPath} className={`space-y-1 ${isTextarea || isImage ? 'col-span-full' : ''}`}>
          {!isImage && (
            <Label htmlFor={fullPath} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </Label>
          )} 
          {isImage ? (
            <ImageUpload
              value={currentValue || ''}
              onChange={(url) => updateValue(url)}
              label={key.replace(/([A-Z])/g, ' $1').trim()}
              placeholder="Upload image or enter URL"
            />
          ) : isTextarea ? (
            <Textarea
              id={fullPath}
              value={currentValue || ''}
              onChange={(e) => updateValue(e.target.value)}
              className="min-h-[60px] text-sm resize-none"
            />
          ) : isColor ? (
            <div className="flex gap-2">
              <Input
                id={fullPath}
                type="color"
                value={currentValue || '#000000'}
                onChange={(e) => updateValue(e.target.value)}
                className="h-8 w-16 p-1 rounded border"
              />
              <Input
                type="text"
                value={currentValue || ''}
                onChange={(e) => updateValue(e.target.value)}
                placeholder="#000000"
                className="h-8 text-sm flex-1"
              />
            </div>
          ) : (
            <Input
              id={fullPath}
              type="text"
              value={currentValue || ''}
              onChange={(e) => updateValue(e.target.value)}
              className="h-8 text-sm"
            />
          )}
        </div>
      );
    }

    // Handle ZodNumber with sliders for padding, height, and other range-based fields
    if (fieldSchema instanceof z.ZodNumber) {
      const isSliderField = key.toLowerCase().includes('padding') || 
                           key.toLowerCase().includes('vertical') || 
                           key.toLowerCase().includes('horizontal') ||
                           key.toLowerCase().includes('height') ||
                           key.toLowerCase().includes('per') ||
                           key.toLowerCase().includes('row') ||
                           key.toLowerCase().includes('column');
      
      if (isSliderField) {
        // Get min/max from Zod checks (default to sensible ranges)
        const checks = (fieldSchema as any)._def?.checks || [];
        const minCheck = checks.find((c: any) => c.kind === 'min');
        const maxCheck = checks.find((c: any) => c.kind === 'max');
        const min = minCheck?.value || 0;
        const max = maxCheck?.value || 200;
        
        const displayValue = (value: number) => {
          if (key.toLowerCase().includes('per') || key.toLowerCase().includes('row') || key.toLowerCase().includes('column')) {
            return `${value}`;
          }
          if (value === 0) return 'default';
          if (key.toLowerCase().includes('vertical') && value === max) return 'full screen';
          return `${value}px`;
        };
        
        return (
          <div key={fullPath} className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor={fullPath} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </Label>
              <span className="text-xs text-muted-foreground">{displayValue(currentValue || 0)}</span>
            </div>
            <Slider
              value={[currentValue || 0]}
              onValueChange={(value) => updateValue(value[0])}
              min={min}
              max={max}
              step={1}
              className="w-full"
            />
          </div>
        );
      } else {
        // Regular number input for non-slider fields
        return (
          <div key={fullPath} className="space-y-1">
            <Label htmlFor={fullPath} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </Label>
            <Input
              id={fullPath}
              type="number"
              value={currentValue || ''}
              onChange={(e) => updateValue(Number(e.target.value))}
              className="h-8 text-sm"
            />
          </div>
        );
      }
    }

    // Handle ZodBoolean (switch controls)
    if (fieldSchema instanceof z.ZodBoolean) {
      return (
        <div key={fullPath} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={fullPath} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </Label>
            <Switch
              id={fullPath}
              checked={currentValue || false}
              onCheckedChange={updateValue}
            />
          </div>
        </div>
      );
    }

    // Fallback for other types
    return (
      <div key={fullPath} className="space-y-1">
        <Label htmlFor={fullPath} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {key.replace(/([A-Z])/g, ' $1').trim()}
        </Label>
        <Input
          id={fullPath}
          type="text"
          value={currentValue?.toString() || ''}
          onChange={(e) => updateValue(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
    );
  };

  // Extract the shape from ZodObject
  if (!(schema instanceof z.ZodObject)) {
    return <div>Schema must be a ZodObject</div>;
  }

  const shape = schema.shape;

  return (
    <div className="grid gap-3" style={{
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
    }}>
      {Object.entries(shape).map(([key, fieldSchema]) =>
        renderField(key, fieldSchema as z.ZodType, values?.[key])
      )}
    </div>
  );
}; 