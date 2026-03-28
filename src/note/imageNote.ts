// @/types/imageNote.ts


export interface ImageMask {
    x: number;      // 遮盖区域的 x 坐标（百分比）
    y: number;      // 遮盖区域的 y 坐标（百分比）
    width: number;  // 遮盖区域的宽度（百分比）
    height: number; // 遮盖区域的高度（百分比）
}


export interface ImageReference {
    id: string;
    filename: string;
    size: number;
    type: string;
    width?: number;
    height?: number;
}


export interface ImageNote {
    imageBase64?: string;           // 图片Base64(旧版本，用于渲染)
    imageUrl?: string;               // 图片URL(在线图片)
    masks?: ImageMask[];        // 遮盖区域列表
    originalWidth?: number;    // 原始图片宽度
    originalHeight?: number;   // 原始图片高度
    maskSvg?: string;             // SVG 遮罩数据
}

// 获取图片URI（优先使用URL，如果没有则使用base64）
export function getImageUri(imageNote: ImageNote | null | undefined): string | undefined {
    if (!imageNote) return undefined;
    return imageNote.imageUrl || imageNote.imageBase64;
}

// 检查是否有图片
export function hasImage(imageNote: ImageNote | null | undefined): boolean {
    if (!imageNote) return false;
    return !!(imageNote.imageUrl || imageNote.imageBase64);
}
