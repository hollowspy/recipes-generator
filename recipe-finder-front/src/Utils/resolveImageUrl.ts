export function resolveImageUrl(imageUrl: string | null | undefined): string {
    const placeholderUrl = 'https://placehold.co';
    if (!imageUrl) return placeholderUrl;

    try {
        const url = new URL(imageUrl);

        if (url.hostname === 'imagesvc.meredithcorp.io') {
            const inner = url.searchParams.get('url');
            if (inner) return inner;
        }

        if (imageUrl.includes('…')) return placeholderUrl;
        return imageUrl;
    } catch {
        return placeholderUrl;
    }
}