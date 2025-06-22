import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Local Types ----
// import { ApiResponse } from '@/types/api'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* ==========================================================================*/
// Deep JSON Parse
/* ==========================================================================*/

export function deepJSONParse(input: string): unknown {
  try {
    // Attempt to parse the input string.
    const parsed = JSON.parse(input)

    // Check if the parsed result is a string that could be parsed further.
    if (typeof parsed === 'string') {
      return deepJSONParse(parsed) // Recursively call itself with the new string.
    } else {
      return parsed // Return the parsed object if it's not a string.
    }
  } catch (error) {
    console.error('Error parsing JSON:', error)
    // If parsing fails, return the original input (the last successfully parsed value).
    return input
  }
}

/* ==========================================================================*/
// API Response Handler
/* ==========================================================================*/

// /**
//  * Handle API response and check for errors
//  * 
//  * @param response - Fetch Response object
//  * @returns Parsed response data
//  */
// export async function handleApiResponse<T = unknown>(response: Response): Promise<T> {
  
//   console.log('🚀 handleApiResponse - STARTING')
//   console.log('📥 handleApiResponse - Input:', JSON.stringify(response, null, 2))
//   if (!response.ok) {
//     console.error('❌ handleApiResponse - HTTP error! status:', response.status, response.statusText)
//     throw new Error(`HTTP error! status: ${response.status}`)
//   }

//   const responseText = await response.text()
  
//   try {
//     const parsedResponse = deepJSONParse(responseText) as ApiResponse<T>
    
//     // Check for backend error response
//     if ('success' in parsedResponse && parsedResponse.success === false) {
//       throw new Error(parsedResponse.error as string || 'Unknown error')
//     }
    
//     return parsedResponse as T
//   } catch (parseError) {
//     // If it's a parse error and not an API error, throw the parse error
//     if (parseError instanceof Error && parseError.message.includes('error')) {
//       throw parseError
//     }
//     // If JSON parsing fails, try to return raw text as fallback
//     console.warn('Failed to parse JSON response, returning raw text')
//     return responseText as unknown as T
//   }
// }

/* ==========================================================================*/
// Prompt Building Helpers
/* ==========================================================================*/

/**
 * Format a prompt template with the given variables
 * 
 * @param promptTemplate - The template string with {variable} placeholders
 * @param variables - Object containing variable values
 * @returns Formatted prompt string
 */
function formatPrompt(promptTemplate: string, variables?: Record<string, unknown>): string {
  console.log('🔧 formatPrompt - STARTING')
  console.log('📥 formatPrompt - Template:', promptTemplate.substring(0, 200) + '...')
  console.log('📥 formatPrompt - Variables:', JSON.stringify(variables, null, 2))

  if (!variables) {
    console.log('⚠️ formatPrompt - No variables provided, returning template as-is')
    return promptTemplate
  }

  let formatted = promptTemplate
  
  try {
    // Replace {variable} placeholders with actual values
    console.log('🔄 formatPrompt - Processing direct variable replacements...')
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key.replace(/\./g, '\\.')}\\}`, 'g')
      const matches = formatted.match(regex)
      if (matches) {
        console.log(`✅ formatPrompt - Replacing {${key}} with:`, String(value || '').substring(0, 100) + '...')
        formatted = formatted.replace(regex, String(value || ''))
      }
    })

    // Handle nested object access with dot notation (e.g., {source.text})
    console.log('🔄 formatPrompt - Processing nested object access...')
    const nestedMatches = formatted.match(/\{[^}]*\.[^}]*\}/g) || []
    console.log('🔍 formatPrompt - Found nested placeholders:', nestedMatches)
    
    nestedMatches.forEach(match => {
      const placeholder = match.slice(1, -1) // Remove { and }
      const keys = placeholder.split('.')
      let nestedValue: unknown = variables
      
      console.log(`🔍 formatPrompt - Resolving nested path: ${placeholder}`)
      
      for (const nestedKey of keys) {
        if (nestedValue && typeof nestedValue === 'object' && nestedKey in nestedValue) {
          nestedValue = (nestedValue as Record<string, unknown>)[nestedKey]
          console.log(`  ✅ Found ${nestedKey}:`, typeof nestedValue === 'string' ? nestedValue.substring(0, 50) + '...' : nestedValue)
        } else {
          console.log(`  ❌ Missing key ${nestedKey} in:`, nestedValue)
          nestedValue = undefined
          break
        }
      }
      
      if (nestedValue !== undefined) {
        console.log(`✅ formatPrompt - Replacing {${placeholder}} with:`, String(nestedValue).substring(0, 100) + '...')
      } else {
        console.log(`⚠️ formatPrompt - Could not resolve {${placeholder}}, replacing with empty string`)
      }
      
      formatted = formatted.replace(new RegExp(`\\{${placeholder.replace(/\./g, '\\.')}\\}`, 'g'), String(nestedValue || ''))
    })

    console.log('✅ formatPrompt - COMPLETED')
    console.log('📤 formatPrompt - Result length:', formatted.length)
    return formatted
    
  } catch (error) {
    console.error('❌ formatPrompt - ERROR:', error)
    console.error('🔍 formatPrompt - Error details:', JSON.stringify(error, null, 2))
    console.error('📊 formatPrompt - Template at error:', promptTemplate.substring(0, 500))
    console.error('📊 formatPrompt - Variables at error:', JSON.stringify(variables, null, 2))
    throw error
  }
}

/**
 * Build system and user prompts with the given variables
 * 
 * @param systemPromptTemplate - System prompt template
 * @param userPromptTemplate - User prompt template  
 * @param systemVariables - Variables for system prompt
 * @param userVariables - Variables for user prompt
 * @returns Tuple of [systemPrompt, userPrompt]
 */
export function buildPrompts(
  systemPromptTemplate: string,
  userPromptTemplate: string,
  systemVariables?: Record<string, unknown>,
  userVariables?: Record<string, unknown>
): [string, string] {
  console.log('🏗️ buildPrompts - STARTING')
  console.log('📥 buildPrompts - System template length:', systemPromptTemplate.length)
  console.log('📥 buildPrompts - User template length:', userPromptTemplate.length)
  console.log('📥 buildPrompts - System variables:', JSON.stringify(systemVariables, null, 2))
  console.log('📥 buildPrompts - User variables:', JSON.stringify(userVariables, null, 2))

  try {
    console.log('🔄 buildPrompts - Building system prompt...')
    const systemPrompt = formatPrompt(systemPromptTemplate, systemVariables)
    
    console.log('🔄 buildPrompts - Building user prompt...')
    const userPrompt = formatPrompt(userPromptTemplate, userVariables)

    console.log('✅ buildPrompts - COMPLETED')
    console.log('📤 buildPrompts - System prompt length:', systemPrompt.length)
    console.log('📤 buildPrompts - User prompt length:', userPrompt.length)

    return [systemPrompt, userPrompt]
  } catch (error) {
    console.error('❌ buildPrompts - ERROR:', error)
    console.error('🔍 buildPrompts - Error details:', JSON.stringify(error, null, 2))
    console.error('📊 buildPrompts - System template:', systemPromptTemplate.substring(0, 200) + '...')
    console.error('📊 buildPrompts - User template:', userPromptTemplate.substring(0, 200) + '...')
    console.error('📊 buildPrompts - System variables:', JSON.stringify(systemVariables, null, 2))
    console.error('📊 buildPrompts - User variables:', JSON.stringify(userVariables, null, 2))
    throw error
  }
}

// /* ==========================================================================*/
// // Lexical Editor State Helpers
// /* ==========================================================================*/

// /**
//  * Convert array of paragraph texts to Lexical SerializedEditorState format
//  * 
//  * @param paragraphs - Array of paragraph text strings
//  * @returns SerializedEditorState compatible object
//  */
// export function textToEditorState(paragraphs: string[]): SerializedEditorState {
//   console.log('🔧 textToEditorState - STARTING')
//   console.log('📥 textToEditorState - Input paragraphs count:', paragraphs.length)

//   // Handle empty array
//   if (!paragraphs || paragraphs.length === 0) {
//     console.log('⚠️ textToEditorState - Empty paragraphs array, returning default state')
//     return {
//       root: {
//         children: [
//           {
//             children: [
//               {
//                 detail: 0,
//                 format: 0,
//                 mode: "normal",
//                 style: "",
//                 text: "",
//                 type: "text",
//                 version: 1,
//               },
//             ],
//             direction: "ltr",
//             format: "",
//             indent: 0,
//             type: "paragraph",
//             version: 1,
//           },
//         ],
//         direction: "ltr",
//         format: "",
//         indent: 0,
//         type: "root",
//         version: 1,
//       },
//     } as unknown as SerializedEditorState
//   }

//   try {
//     // Filter out empty paragraphs and trim whitespace
//     const validParagraphs = paragraphs
//       .map(para => para?.trim() || "")
//       .filter(para => para.length > 0)

//     console.log('🔄 textToEditorState - Valid paragraphs after filtering:', validParagraphs.length)

//     // If no valid paragraphs, return empty state
//     if (validParagraphs.length === 0) {
//       console.log('⚠️ textToEditorState - No valid paragraphs, returning empty state')
//       return {
//         root: {
//           children: [
//             {
//               children: [
//                 {
//                   detail: 0,
//                   format: 0,
//                   mode: "normal",
//                   style: "",
//                   text: "",
//                   type: "text",
//                   version: 1,
//                 },
//               ],
//               direction: "ltr",
//               format: "",
//               indent: 0,
//               type: "paragraph",
//               version: 1,
//             },
//           ],
//           direction: "ltr",
//           format: "",
//           indent: 0,
//           type: "root",
//           version: 1,
//         },
//       } as unknown as SerializedEditorState
//     }

//     // Create paragraph nodes from each paragraph text
//     const paragraphNodes = validParagraphs.map(paragraphText => ({
//       children: [
//         {
//           detail: 0,
//           format: 0,
//           mode: "normal" as const,
//           style: "",
//           text: paragraphText,
//           type: "text" as const,
//           version: 1,
//         },
//       ],
//       direction: "ltr" as const,
//       format: "",
//       indent: 0,
//       type: "paragraph" as const,
//       version: 1,
//     }))

//     const editorState = {
//       root: {
//         children: paragraphNodes,
//         direction: "ltr" as const,
//         format: "",
//         indent: 0,
//         type: "root" as const,
//         version: 1,
//       },
//     } as unknown as SerializedEditorState

//     console.log('✅ textToEditorState - COMPLETED')
//     console.log('📤 textToEditorState - Generated paragraphs:', paragraphNodes.length)
    
//     return editorState

//   } catch (error) {
//     console.error('❌ textToEditorState - ERROR:', error)
//     console.error('🔍 textToEditorState - Input paragraphs:', paragraphs)
    
//     // Return fallback state with first paragraph or empty
//     const fallbackText = paragraphs[0]?.substring(0, 1000) || ""
//     return {
//       root: {
//         children: [
//           {
//             children: [
//               {
//                 detail: 0,
//                 format: 0,
//                 mode: "normal",
//                 style: "",
//                 text: fallbackText,
//                 type: "text",
//                 version: 1,
//               },
//             ],
//             direction: "ltr",
//             format: "",
//             indent: 0,
//             type: "paragraph",
//             version: 1,
//           },
//         ],
//         direction: "ltr",
//         format: "",
//         indent: 0,
//         type: "root",
//         version: 1,
//       },
//     } as unknown as SerializedEditorState
//   }
// }


/**
 * cleanSlug
 * 
 * Clean and sanitize a slug according to strict requirements.
 * - Converts to lowercase
 * - Removes special characters and dashes
 * - Removes spaces
 * - Only allows letters and numbers
 * 
 * @param input - The input string to clean
 * @returns A clean slug string with only lowercase letters and numbers
 * 
 * @example
 * cleanSlug("My Article Title!") // => "myarticletitle"
 * cleanSlug("Hello-World_123") // => "helloworld123"
 */
export function cleanSlug(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .toLowerCase()                    // Convert to lowercase
    .trim()                          // Remove leading/trailing whitespace
    .replace(/[^a-z0-9]/g, '')       // Remove everything except lowercase letters and numbers
    .substring(0, 50);               // Limit length to 50 characters
}
