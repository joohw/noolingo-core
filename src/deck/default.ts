import { Deck } from './deck_model';
import { v4 as uuidv4 } from 'uuid';
import { DeckTopic } from './deck_model';
import { defaultSortState } from './deck_model';
import { defaultNoteLayout } from './deck_model';
import { defaultReviewSettings } from './deck_model';


export function createDefaultDeck(deckData: Partial<Deck> = {}): Deck {
    const now = new Date();
    return {
        id: deckData.id || uuidv4(),
        name: deckData.name || 'untitled',
        description: deckData.description || '',
        topic: deckData.topic ?? DeckTopic.GENERAL,
        labels: deckData.labels || [],
        created_at: deckData.created_at || now.toISOString(),
        updated_at: deckData.updated_at || now.toISOString(),
        sortState: deckData.sortState ?? defaultSortState,
        layout: deckData.layout ?? defaultNoteLayout,
        archived: deckData.archived ?? false,
        reviewSettings: deckData.reviewSettings ?? defaultReviewSettings,
        paths: deckData.paths,
        stats: {
            notes_count: 0,
            new_count: 0,
            archived_count: 0,
            reviewable_count: 0,
            total_stability: 0,
        },
    };
}
