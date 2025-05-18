export interface Preset {
  id: string;
  title: string;
  description: string;
  image: string | null;
  category: string;
  filters: {
    daw: string | string[];
    gender: string | string[];
    genre: string | string[];
    plugin: string | string[];
    [key: string]: string | string[];
  };
  mp3s: {
    before: string | null;
    after: string | null;
  };
  fullPreset: string | null;
  uploader: {
    name: string;
    avatar: string;
    email?: string | null;
  };
  credit_cost: number;
}

export interface AudioPlaying {
  audio: HTMLAudioElement;
  type: string;
}

export interface AudioState {
  progress: number;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  isLoading: boolean;
  isDragging: boolean;
}

export interface DownloadOption {
  type: 'full';
  label: string;
  description: string;
  creditCost: number;
}

export interface DownloadItem {
  url: string;
  filename: string;
}

export interface CreditRequirements {
  totalCredits: number;
  newDownloadCredits: number;
  previouslyDownloadedCount: number;
  freeRedownloadCount: number;
  paidRedownloadCount: number;
  itemsToDownload: string[];
}

export interface UploaderInfo {
  name: string;
  avatar: string;
  email?: string | null;
}

// Component props interfaces
export interface PresetHeaderProps {
  preset: Preset;
  isFavorite: boolean;
  setIsFavorite: (value: boolean) => void;
  onAuthRequired: (callback: () => void) => boolean;
  onDownloadComplete?: () => void;
}

export interface PresetInfoProps {
  preset: Preset;
}

export interface PresetAudioProps {
  preset: Preset;
  presets: Preset[];
}

export interface PresetDownloadProps {
  preset: Preset;
  downloadHistory: any[];
  onAuthRequired: (callback: () => void) => boolean;
  presets: Preset[];
  onNavigate?: (page: string, param?: string | null) => void;
  onDownloadComplete?: () => void;
}

export interface RelatedPresetsProps {
  currentPreset: Preset;
  allPresets: Preset[];
  onNavigate: (page: string, param?: string | null) => void;
}