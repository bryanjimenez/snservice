declare module '@nmemonica/x-spreadsheet'{

export interface ExtendToolbarOption {
  tip?: string;
  el?: HTMLElement;
  icon?: string;
  onClick?: (data: object, sheet: object) => void;
}
export interface Options {
  mode?: "edit" | "read";
  showToolbar?: boolean;
  showGrid?: boolean;
  showContextmenu?: boolean;
  showBottomBar?: boolean;
  extendToolbar?: {
    left?: ExtendToolbarOption[];
    right?: ExtendToolbarOption[];
  };
  autoFocus?: boolean;
  view?: {
    height: () => number;
    width: () => number;
  };
  row?: {
    len: number;
    height: number;
  };
  col?: {
    len: number;
    width: number;
    indexWidth: number;
    minWidth: number;
  };
  style?: {
    bgcolor: string;
    align: "left" | "center" | "right";
    valign: "top" | "middle" | "bottom";
    textwrap: boolean;
    strike: boolean;
    underline: boolean;
    color: string;
    font: {
      name: "Helvetica";
      size: number;
      bold: boolean;
      italic: false;
    };
  };
}

export type CELL_SELECTED = "cell-selected";
export type CELLS_SELECTED = "cells-selected";
export type CELL_EDITED = "cell-edited";

export type CellMerge = [number, number];

export interface SpreadsheetEventHandler {
  (
    envt: CELL_SELECTED,
    callback: (cell: Cell, rowIndex: number, colIndex: number) => void,
  ): void;
  (
    envt: CELLS_SELECTED,
    callback: (
      cell: Cell,
      parameters: { sri: number; sci: number; eri: number; eci: number },
    ) => void,
  ): void;
  (
    evnt: CELL_EDITED,
    callback: (text: string, rowIndex: number, colIndex: number) => void,
  ): void;
}

export interface ColProperties {
  width?: number;
}

/**
 * Data for representing a cell
 */
export interface CellData {
  text: string;
  style?: number;
  merge?: CellMerge;
}
/**
 * Data for representing a row
 */
export interface RowData {
  cells: {
    [key: number]: CellData;
  };
}

/**
 * Data for representing a sheet
 */
export interface SheetData {
  name?: string;
  freeze?: string;
  styles?: CellStyle[];
  merges?: string[];
  cols?: {
    len?: number;
    [key: number]: ColProperties;
  };
  rows?: {
    [key: number]: RowData;
  };
}

/**
 * Data for representing a spreadsheet
 */
export interface SpreadsheetData {
  [index: number]: SheetData;
}

export interface CellStyle {
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  font?: {
    bold?: boolean;
  };
  bgcolor?: string;
  textwrap?: boolean;
  color?: string;
  border?: {
    top?: string[];
    right?: string[];
    bottom?: string[];
    left?: string[];
  };
}
export interface Editor {}
export interface Element {}

export interface Row {}
export interface Table {}
export interface Cell {}
}