export interface AiProvider {
  getModelName(): string;
  embed(text: string): Promise<number[]>;
}
