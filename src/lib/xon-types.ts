export interface HomeRow {
	name: string;
	items: ContentItem[];
}

export type ContentType = 'movie' | 'series' | 'episode';

export type Source = 'xon' | 'kartoons' | 'meow';

export interface ContentItem {
	id: string; // show:ID | movie:ID | episode:ID
	title: string;
	type: ContentType;
	poster?: string;
	backdrop?: string;
	description?: string;
	source?: Source;
}

export interface EpisodeItem {
	id: string; // episode:ID
	title: string;
	season?: number;
	episode?: number;
	poster?: string;
	description?: string;
}

export interface Details {
	id: string;
	title: string;
	type: 'movie' | 'series' | 'episode';
	poster?: string;
	backdrop?: string;
	description?: string;
	episodes?: EpisodeItem[];
	episodeNumber?: number;
	seasonNumber?: number;
	showId?: string;
}

export interface StreamQuality {
	label: string;
	url: string;
}

export interface StreamResponse {
	title: string;
	qualities: StreamQuality[];
}
