// @/lib/render/renderPrintLayout.ts

import { Note } from '../note/note_model';
import { renderNotes } from '../render/renderNotes';
import { getRenderCss } from './renderCss';
import { parse, HTMLElement } from 'node-html-parser';



export type Layout = 'single' | 'double';
export type FontSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
export type FontFamily = string; // 字体族，支持任意字符串。'sans' 和 'prose' 对应系统默认字体
export type Spacing = 'tight' | 'normal' | 'loose';
export type Margin = 'extraNarrow' | 'narrow' | 'normal' | 'wide' | 'extraWide';


export interface PrintStyles {
    hideMasks: boolean;
    layout: Layout;
    horizontalMargin: Margin;
    verticalMargin: Margin;
    spacing: Spacing;
    showDivider: boolean;
    fontSize: FontSize;
    fontFamily: FontFamily;
}

export const DEFAULT_PRINT_STYLES: PrintStyles = {
    layout: 'single',
    horizontalMargin: 'normal',
    verticalMargin: 'normal',
    spacing: 'normal',
    showDivider: true,
    fontSize: 'xs',
    fontFamily: 'sans',
    hideMasks: false
};

export interface PrintStyleOptions {
    spacing: Spacing;
    horizontalMargin: Margin;
    verticalMargin: Margin;
    isDoubleColumn: boolean;
}


const MARGINS_MAP: Record<Margin, string> = {
    extraNarrow: '0.5cm',
    narrow: '1cm',
    normal: '1.5cm',
    wide: '2cm',
    extraWide: '2.5cm'
};

const SPACING_MAP: Record<Spacing, string> = {
    tight: '0.5em',
    normal: '0.75em',
    loose: '1em',
};


export const getPrintCss = (options: PrintStyleOptions) => `
    @page { 
        size: A4;
        margin: ${MARGINS_MAP[options.verticalMargin]} ${MARGINS_MAP[options.horizontalMargin]};
    }

    @media print {
        .a4-container {
            padding: 0 !important;
        }
    }

    .a4-container {
        padding: 0;
        margin: 0;
        width: 210mm;
        page-break-after: always;
        box-sizing: border-box;
        padding: ${MARGINS_MAP[options.verticalMargin]} ${MARGINS_MAP[options.horizontalMargin]};
        ${options.isDoubleColumn ? `
            column-count: 2;
            column-gap: ${MARGINS_MAP[options.horizontalMargin]};
        ` : 'column-count: 1;'}
    }

    .a4-container:last-of-type {
        page-break-after: avoid;
    }

    .notes-container {
        box-sizing: border-box;
    }

    .note-divider {
        height: 1px;
        background-color: var(--border,#ccc);
        opacity:0.5;
        break-inside: avoid;
        page-break-inside: avoid;
        margin: ${SPACING_MAP[options.spacing]} 0;
    }
`;





export async function printNotesToHtml(notes: Note[], printStyles: PrintStyles = DEFAULT_PRINT_STYLES) {
    const baseStyles = getRenderCss()
    const printCssStyles = getPrintCss({
        spacing: printStyles.spacing,
        horizontalMargin: printStyles.horizontalMargin,
        verticalMargin: printStyles.verticalMargin,
        isDoubleColumn: printStyles.layout === 'double'
    });
    const renderOptions = {
        initiallyHidden: printStyles.hideMasks,
    }
    const content = await renderNotes(notes, renderOptions, printStyles.showDivider);
    // 应用字体、字号和间距类名
    const root = parse(content);
    const contentContainers = root.querySelectorAll('.noolingo-content');
    contentContainers.forEach((container: HTMLElement) => {
        container.classList.add(`text-${printStyles.fontSize}`);
        container.classList.add(`noolingo-font-${printStyles.fontFamily}`);
        container.classList.add(`noolingo-space-${printStyles.spacing}`);
    });
    const styledContent = root.toString();
    const printedHtml = `
          <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Print Notes</title>
                    <style>
                        ${baseStyles}
                        ${printCssStyles}
                    </style>
                </head>
                <body>
                    ${styledContent}
                </body>
            </html>
      `;

    return printedHtml;
}