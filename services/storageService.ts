
import { GameState, MapData, PlacedBuilding } from "../types";

const SAVE_KEY = 'mini_city_save_v1';

export interface SaveData {
  gameState: GameState;
  mapData: MapData;
  buildings: PlacedBuilding[];
  timeOfDay: number;
}

class StorageService {
  private isTelegramAvailable(): boolean {
    return typeof window !== 'undefined' && 
           !!(window as any).Telegram?.WebApp?.CloudStorage;
  }

  async saveState(data: SaveData): Promise<void> {
    try {
      const serialized = JSON.stringify(data);
      if (this.isTelegramAvailable()) {
        const tg = (window as any).Telegram.WebApp;
        return new Promise((resolve, reject) => {
            tg.CloudStorage.setItem(SAVE_KEY, serialized, (err: any, stored: boolean) => {
                if (err) {
                    console.error("CloudStorage Save Error:", err);
                    // Fallback
                    localStorage.setItem(SAVE_KEY, serialized);
                    resolve();
                } else {
                    resolve();
                }
            });
        });
      } else {
        localStorage.setItem(SAVE_KEY, serialized);
      }
    } catch (e) {
      console.error("Save failed:", e);
    }
  }

  async loadState(): Promise<SaveData | null> {
    try {
      if (this.isTelegramAvailable()) {
        const tg = (window as any).Telegram.WebApp;
        return new Promise((resolve) => {
            tg.CloudStorage.getItem(SAVE_KEY, (err: any, value: string) => {
                if (!err && value) {
                    try {
                        resolve(JSON.parse(value));
                    } catch {
                        resolve(this.loadFromLocal());
                    }
                } else {
                    resolve(this.loadFromLocal());
                }
            });
        });
      } else {
        return this.loadFromLocal();
      }
    } catch (e) {
      console.error("Load failed:", e);
      return null;
    }
  }

  private loadFromLocal(): SaveData | null {
      const local = localStorage.getItem(SAVE_KEY);
      if (local) {
          try {
              return JSON.parse(local);
          } catch {
              return null;
          }
      }
      return null;
  }
}

export const storageService = new StorageService();
