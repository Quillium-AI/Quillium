interface QuestionExtractionResult {
  cleanContent: string;
  questions: string[];
}

const COMMON_WORDS = new Set([
  'the', 'and', 'for', 'are', 'this', 'that', 'with', 'from', 'your', 'have', 'would',
  'what', 'when', 'where', 'why', 'how', 'which', 'who', 'whom', 'whose'
]);

export function extractRelatedQuestions(content: string): QuestionExtractionResult {
  // Clean the content by removing markdown and extra whitespace
  const cleanContent = content
    .replace(/\[\d+\]/g, '') // Remove citations [1], [2], etc.
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/[*_`#]/g, '') // Remove markdown formatting
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();

  if (cleanContent.length < 50) {
    return { cleanContent, questions: [] }; // Not enough content to generate meaningful questions
  }

  // Force direct content-based questions - no generic fallbacks allowed
  const specificQuestions = forceContentSpecificQuestions(cleanContent);
  
  // If we somehow still don't have questions, return empty array rather than fallbacks
  if (specificQuestions.length === 0) {
    return { cleanContent, questions: [] };
  }
  
  return {
    cleanContent,
    questions: specificQuestions.slice(0, 3) // Return top 3 questions
  };
}

// This function is no longer used with our new approach

function extractProperNouns(text: string): string[] {
  return Array.from(
    new Set(
      (text.match(/(?:^|\s)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g) || [])
        .map(noun => noun.trim())
        .filter(noun => noun.length > 3 && !COMMON_WORDS.has(noun.toLowerCase()))
    )
  );
}

// These functions are no longer used with our new approach

// This function is no longer used with our new approach

// This function is no longer used with our new approach

/**
 * Selects a diverse set of questions to avoid repetition
 */
/**
 * Forces the generation of content-specific questions with no generic fallbacks
 */
function forceContentSpecificQuestions(content: string): string[] {
  const contentLower = content.toLowerCase();
  const questions: string[] = [];
  
  // Extract key phrases (2-3 word combinations that might be important)
  const keyPhrases = extractKeyPhrases(content);
  
  // Extract technical terms
  const technicalTerms = extractTechnicalTerms(content);
  
  // Extract named entities (proper nouns)
  const namedEntities = extractProperNouns(content);
  
  // Generate questions for the most important key phrases
  for (const phrase of keyPhrases.slice(0, 5)) {
    // Implementation questions
    if (contentLower.includes('implement') || contentLower.includes('create') || contentLower.includes('build')) {
      questions.push(`How would you implement ${phrase} in a real-world application?`);
    }
    
    // Comparison questions
    if (contentLower.includes('compare') || contentLower.includes('versus') || contentLower.includes('difference')) {
      questions.push(`What are the advantages of ${phrase} compared to alternatives?`);
    }
    
    // Best practices
    if (contentLower.includes('practice') || contentLower.includes('pattern') || contentLower.includes('approach')) {
      questions.push(`What are the best practices when working with ${phrase}?`);
    }
    
    // Performance questions
    if (contentLower.includes('performance') || contentLower.includes('optimize') || contentLower.includes('efficient')) {
      questions.push(`How can ${phrase} be optimized for better performance?`);
    }
  }
  
  // Generate questions for technical terms
  for (const term of technicalTerms.slice(0, 3)) {
    questions.push(`What are the key features of ${term}?`);
    questions.push(`How does ${term} work under the hood?`);
    questions.push(`What problems does ${term} solve?`);
  }
  
  // Generate questions for named entities
  for (const entity of namedEntities.slice(0, 3)) {
    if (entity.length > 3) {
      questions.push(`How is ${entity} typically used in this context?`);
      questions.push(`What makes ${entity} important?`);
    }
  }
  
  // Add domain-specific questions based on detected technologies
  if (contentLower.includes('javascript') || contentLower.includes('typescript') || contentLower.includes('react')) {
    questions.push('What JavaScript patterns would be most effective here?');
    questions.push('How would you structure this in a modern React application?');
  }
  
  if (contentLower.includes('database') || contentLower.includes('sql') || contentLower.includes('nosql')) {
    questions.push('Which database schema would be most efficient for this use case?');
    questions.push('How would you optimize the database queries for this scenario?');
  }
  
  if (contentLower.includes('api') || contentLower.includes('rest') || contentLower.includes('graphql')) {
    questions.push('What API design principles should be applied in this situation?');
    questions.push('How would you handle authentication and authorization for this API?');
  }
  
  if (contentLower.includes('security') || contentLower.includes('auth') || contentLower.includes('encrypt')) {
    questions.push('What security considerations are important for this implementation?');
    questions.push('How would you protect against common security vulnerabilities here?');
  }
  
  // Remove any questions that contain generic phrases
  const filteredQuestions = questions.filter(q => {
    const qLower = q.toLowerCase();
    return !qLower.includes('this in simpler terms') && 
           !qLower.includes('key takeaways') && 
           !qLower.includes('relate to what we discussed');
  });
  
  // Ensure diversity in question types
  return selectDiverseQuestions(filteredQuestions);
}

/**
 * Extracts key phrases (2-3 word combinations) from content
 */
function extractKeyPhrases(content: string): string[] {
  const words = content.split(/\s+/);
  const phrases: string[] = [];
  
  // Extract 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const word1 = words[i].replace(/[^a-zA-Z0-9]/g, '');
    const word2 = words[i + 1].replace(/[^a-zA-Z0-9]/g, '');
    
    if (word1.length > 3 && word2.length > 3 && 
        !COMMON_WORDS.has(word1.toLowerCase()) && 
        !COMMON_WORDS.has(word2.toLowerCase())) {
      phrases.push(`${word1} ${word2}`);
    }
  }
  
  // Extract 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    const word1 = words[i].replace(/[^a-zA-Z0-9]/g, '');
    const word2 = words[i + 1].replace(/[^a-zA-Z0-9]/g, '');
    const word3 = words[i + 2].replace(/[^a-zA-Z0-9]/g, '');
    
    if (word1.length > 2 && word2.length > 2 && word3.length > 2 && 
        !COMMON_WORDS.has(word1.toLowerCase()) && 
        !COMMON_WORDS.has(word3.toLowerCase())) {
      phrases.push(`${word1} ${word2} ${word3}`);
    }
  }
  
  return Array.from(new Set(phrases));
}

/**
 * Extracts technical terms from content
 */
function extractTechnicalTerms(content: string): string[] {
  const techTermPatterns = [
    /([A-Z][a-z]+Script)/g,                 // JavaScript, TypeScript, etc.
    /([A-Z][a-z]*(?:DB|API|SDK|UI|UX))/g,   // MongoDB, GraphQL, RestAPI, etc.
    /((?:Node|React|Vue|Angular|Express|Next|Nuxt)[A-Za-z]*)/g, // Node.js, React, etc.
    /([A-Za-z]+\.js)/g,                    // Next.js, Node.js, etc.
    /(HTML|CSS|SQL|JSON|XML|YAML|HTTP|HTTPS|REST|GraphQL)/g, // Common tech acronyms
  ];
  
  const terms: string[] = [];
  
  for (const pattern of techTermPatterns) {
    const matches = content.match(pattern) || [];
    terms.push(...matches);
  }
  
  return Array.from(new Set(terms));
}

/**
 * Selects a diverse set of questions to avoid repetition
 */
function selectDiverseQuestions(questions: string[]): string[] {
  if (questions.length <= 3) {
    return deduplicateQuestions(questions);
  }
  
  // Deduplicate questions first
  const uniqueQuestions = deduplicateQuestions(questions);
  
  // If we still have more than 3 questions, select diverse ones
  if (uniqueQuestions.length <= 3) {
    return uniqueQuestions;
  }
  
  // Categorize questions by type to ensure diversity
  const howQuestions = uniqueQuestions.filter(q => q.toLowerCase().startsWith('how'));
  const whatQuestions = uniqueQuestions.filter(q => q.toLowerCase().startsWith('what'));
  const whyQuestions = uniqueQuestions.filter(q => q.toLowerCase().startsWith('why'));
  const otherQuestions = uniqueQuestions.filter(q => 
    !q.toLowerCase().startsWith('how') && 
    !q.toLowerCase().startsWith('what') && 
    !q.toLowerCase().startsWith('why')
  );
  
  // Try to select one from each category if possible
  const result: string[] = [];
  
  // Add one question from each category if available
  if (howQuestions.length > 0) result.push(howQuestions[0]);
  if (result.length < 3 && whatQuestions.length > 0) result.push(whatQuestions[0]);
  if (result.length < 3 && whyQuestions.length > 0) result.push(whyQuestions[0]);
  if (result.length < 3 && otherQuestions.length > 0) result.push(otherQuestions[0]);
  
  // If we still need more questions, add from remaining categories
  if (result.length < 3) {
    const remaining = uniqueQuestions.filter(q => !result.includes(q));
    result.push(...remaining.slice(0, 3 - result.length));
  }
  
  return result;
}

function deduplicateQuestions(questions: string[]): string[] {
  return Array.from(new Set(questions));
}
