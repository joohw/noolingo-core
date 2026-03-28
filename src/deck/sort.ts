import { Deck, DeckSortKey, SortOrder } from './deck_model';



export function sortDecks(decks: Deck[], key: DeckSortKey, order: SortOrder): Deck[] {
    return decks.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        switch (key) {
            case 'name':
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
            case 'notes_count':
                aValue = a.stats?.notes_count || 0;
                bValue = b.stats?.notes_count || 0;
                break;
            case 'created_at':
                aValue = new Date(a.created_at).getTime();
                bValue = new Date(b.created_at).getTime();
                break;
            case 'updated_at':
                aValue = new Date(a.updated_at).getTime();
                bValue = new Date(b.updated_at).getTime();
                break;
            default:
                return 0;
        }
        let result = 0;
        if (aValue < bValue) result = -1;
        if (aValue > bValue) result = 1;
        return order === 'asc' ? result : -result;
    });
}


