import { ANIMATION_DESCRIPTIONS } from './animationRegistry';
import { SECTION_DESCRIPTIONS } from './sectionRegistry';

interface AIEnhanceRequest {
  currentContent: any;
  userPrompt: string;
  componentType: string;
}

interface AIEnhanceResponse {
  enhancedContent: any;
}

interface AIPageGenerateRequest {
  userPrompt: string;
  availableComponents: string[];
}

interface AIPageGenerateResponse {
  sections: Array<{
    component_type: string;
    visible?: boolean;
    background?: {
      static_color?: 'background' | 'muted' | 'accent' | 'secondary' | 'primary' | 'card';
      animated_type?: string;
      opacity?: number;
    };
  }>;
}

class AISectionAssistant {
  private baseUrl = "https://openrouter.ai/api/v1/chat/completions";
  private apiKey: string | null = null;

  constructor() {
    // Remove API key validation from constructor - do it lazily when needed
  }

  private ensureApiKey(): string {
    if (this.apiKey === null) {
      this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!this.apiKey || this.apiKey.trim() === '') {
        throw new Error('OpenRouter API key not configured. Please add VITE_OPENROUTER_API_KEY to your environment variables to use AI features.');
      }
    }
    return this.apiKey;
  }

  async enhanceSection({ currentContent, userPrompt, componentType }: AIEnhanceRequest): Promise<AIEnhanceResponse> {
    try {
      const apiKey = this.ensureApiKey(); // Validate API key only when method is called
      const prompt = this.buildPrompt(currentContent, userPrompt, componentType);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Section AI Assistant'
        },
        body: JSON.stringify({
          model: "openai/gpt-4.1",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error response:', errorText);
        throw new Error(`OpenRouter API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Full API response:', data);
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Unexpected API response structure:', data);
        throw new Error('Invalid API response structure');
      }

      const content = data.choices[0].message.content;
      console.log('Raw AI response content:', content);
      console.log('Current content sent to AI:', JSON.stringify(currentContent, null, 2));
      console.log('User prompt sent to AI:', userPrompt);
      console.log('Component type sent to AI:', componentType);
      
      if (!content || content.trim() === '') {
        throw new Error('AI returned empty response');
      }

      // With response_format: json_object, the content should be valid JSON
      let enhancedContent;
      try {
        enhancedContent = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        console.error('Raw content that failed to parse:', content);
        throw new Error('AI returned invalid JSON response');
      }

      // Validate that the response is not empty
      if (!enhancedContent || Object.keys(enhancedContent).length === 0) {
        console.error('AI returned empty object - this should not happen');
        console.error('Full prompt sent:', this.buildPrompt(currentContent, userPrompt, componentType));
        throw new Error('AI returned empty content object');
      }

      return { enhancedContent };
    } catch (error) {
      console.error('AI section enhancement failed:', error);
      throw error;
    }
  }

  async generatePage({ userPrompt, availableComponents }: AIPageGenerateRequest): Promise<AIPageGenerateResponse> {
    try {
      const apiKey = this.ensureApiKey(); // Validate API key only when method is called
      
      // Fetch available animations dynamically
      const availableAnimations = await this.fetchAvailableAnimations();
      
      const prompt = this.buildPagePrompt(userPrompt, availableComponents, availableAnimations);
      
      console.log('🤖 AI PAGE GENERATION - FULL PROMPT:');
      console.log(prompt);
      console.log('📝 USER REQUEST:', userPrompt);
      console.log('🧩 AVAILABLE COMPONENTS:', availableComponents);
      console.log('🎨 AVAILABLE ANIMATIONS:', availableAnimations);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Page AI Assistant'
        },
        body: JSON.stringify({
          model: "openai/gpt-4.1",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error response:', errorText);
        throw new Error(`OpenRouter API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('🔄 RAW API RESPONSE:', data);
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid API response structure');
      }

      const content = data.choices[0].message.content;
      
      console.log('📄 RAW AI RESPONSE CONTENT:');
      console.log(content);
      
      if (!content || content.trim() === '') {
        throw new Error('AI returned empty response');
      }

      const pageStructure = JSON.parse(content);
      
      console.log('✅ PARSED PAGE STRUCTURE:');
      console.log(JSON.stringify(pageStructure, null, 2));

      return pageStructure;
    } catch (error) {
      console.error('AI page generation failed:', error);
      throw error;
    }
  }

  private buildPrompt(currentContent: any, userPrompt: string, componentType: string): string {
    return `You are a professional web content assistant. Your job is to enhance section content based on user requests while maintaining the exact JSON structure.

CURRENT SECTION TYPE: ${componentType}

CURRENT CONTENT:
${JSON.stringify(currentContent, null, 2)}

USER REQUEST: "${userPrompt}"

IMPORTANT RULES:
1. You MUST respond with valid JSON only - no explanations, no markdown, no code blocks
2. Return ONLY the JSON object that matches the exact structure of the current content
3. Keep all property names and data types exactly the same
4. Enhance/modify text content, URLs, and settings based on the user's request
5. Do not add or remove properties from the JSON structure
6. Keep button configurations (visible, variant, size, etc.) unless specifically requested to change them
7. Ensure all text content is professional, engaging, and appropriate
8. If the request is unclear or inappropriate, make minimal conservative changes

EXAMPLES OF GOOD CHANGES:
- Updating title and subtitle text to match requested tone/topic
- Changing button text and URLs to match new purpose
- Adjusting color selections if requested
- Modifying descriptions and content to fit new theme

EXAMPLES TO AVOID:
- Adding new properties not in the original structure
- Changing data types (string to number, etc.)
- Removing required properties
- Making dramatic changes unless specifically requested

Return only the enhanced JSON object with no additional text:`;
  }

  private buildPagePrompt(userPrompt: string, availableComponents: string[], availableAnimations: Array<{value: string, label: string}>): string {
    // Build rich components list using metadata from registry
    const componentsList = availableComponents.map(comp => {
      const meta = SECTION_DESCRIPTIONS[comp];
      if (meta) {
        return `• "${comp}" - ${meta.name}: ${meta.description}`;
      } else {
        // Fallback for components without metadata yet
        return `• "${comp}" - Component available`;
      }
    }).join('\n');
    
    // Build rich animations list using descriptions from registry
    const animationsList = availableAnimations.length > 0 
      ? availableAnimations.map(anim => {
          const meta = ANIMATION_DESCRIPTIONS[anim.value];
          if (meta && meta.description) {
            return `• "${anim.value}" - ${meta.description}`;
          } else {
            // Fallback to basic label if no description yet
            return `• "${anim.value}" - ${anim.label}`;
          }
        }).join('\n')
      : '• No animations available';
    
    return `Create a tasteful, user-focused page layout for: "${userPrompt}"

AVAILABLE SECTIONS:
${componentsList}

ANIMATIONS AVAILABLE:
${animationsList}

COLORS AVAILABLE:
• "background" - default page color (neutral, safe choice)
• "muted" - subtle gray, professional (good for variety without boldness)
• "card" - clean card background (neutral, readable)
• "secondary" - supporting brand color (moderate brand presence)
• "accent" - BOLD brand highlight (draws major attention)
• "primary" - BOLD main brand color (very attention-grabbing)

DESIGN PHILOSOPHY:
• Consider the user's goal - are they trying to read, learn, or take action?

BACKGROUND USAGE GUIDELINES:
• Consider the visual weight and attention-grabbing power of each color
• IMPORTANT: Accent and primary colors can make text unreadable unless content is in cards or separated elements
• Avoid crowded animation and bold backgrounds on text-heavy sections

ANIMATION USAGE GUIDELINES:
• For animations that are sparse, use a higher opacity (bubbles or floating circles would have higher opacity), for very busy animations use a lower opacity (fullscreen animations like bars would have lower opacity)
- feel free to get creative with animation selection



SECTION SELECTION PRINCIPLES:
• Choose 2-7 sections total (avoid overwhelming users)
• Each section should have a clear purpose in the user journey
• Consider the logical flow of the page
• Match section complexity to business type

Return JSON only:
{
  "sections": [
    {
      "component_type": "Hero1", 
      "visible": true,
      "background": {
        "static_color": "accent",
        "animated_type": "floating_circles", 
        "opacity": 0.4
      }
    }
  ]
}`;
  }

  // Helper method to fetch available animations
  private async fetchAvailableAnimations(): Promise<Array<{value: string, label: string}>> {
    try {
      const response = await fetch('/api/v1/backgrounds/');
      if (response.ok) {
        const data = await response.json();
        return data.animated_backgrounds || [];
      }
    } catch (error) {
      console.error('Failed to fetch available animations:', error);
    }
    return [];
  }
}

// Lazy singleton pattern - only create instance when first accessed
let aiSectionAssistantInstance: AISectionAssistant | null = null;

export const aiSectionAssistant = {
  get instance(): AISectionAssistant {
    if (aiSectionAssistantInstance === null) {
      aiSectionAssistantInstance = new AISectionAssistant();
    }
    return aiSectionAssistantInstance;
  },
  
  // Proxy methods to the singleton instance
  async enhanceSection(params: AIEnhanceRequest): Promise<AIEnhanceResponse> {
    return this.instance.enhanceSection(params);
  },
  
  async generatePage(params: AIPageGenerateRequest): Promise<AIPageGenerateResponse> {
    return this.instance.generatePage(params);
  }
};

export type { AIEnhanceRequest, AIEnhanceResponse, AIPageGenerateRequest, AIPageGenerateResponse }; 