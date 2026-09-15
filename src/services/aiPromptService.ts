import apiClient from './api';

export interface AiPromptConfiguration {
  id?: string; feature: string; name: string; promptText: string;
  enabled: boolean; isUsingDefault: boolean; updatedAt?: string;
}
export const aiPromptService = {
  getClassification: () => apiClient.get<unknown, AiPromptConfiguration>('/ai-prompt-configurations/classification'),
  saveClassification: (data: { name: string; promptText: string; enabled: boolean }) =>
    apiClient.put('/ai-prompt-configurations/classification', data),
  resetClassification: () => apiClient.delete('/ai-prompt-configurations/classification'),
};
