declare module "recharts" {
  import type { ComponentType, ReactElement, ReactNode, SVGProps } from "react";

  type CommonProps = {
    children?: ReactNode;
    className?: string;
  };

  type ChartProps<T = unknown> = CommonProps & {
    barCategoryGap?: number | string;
    data?: T[];
    height?: number | string;
    layout?: "horizontal" | "vertical";
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    width?: number | string;
  };

  type AxisProps = CommonProps & {
    allowDecimals?: boolean;
    axisLine?: boolean;
    dataKey?: string;
    hide?: boolean;
    minTickGap?: number;
    stroke?: string;
    tick?: SVGProps<SVGTextElement> | boolean;
    tickFormatter?: (value: never) => string;
    tickLine?: boolean;
    type?: "number" | "category";
    width?: number;
  };

  type SeriesProps = CommonProps & {
    activeDot?: SVGProps<SVGCircleElement> & { r?: number };
    dataKey?: string;
    fill?: string;
    name?: string;
    radius?: number[];
    stroke?: string;
    strokeWidth?: number;
    type?: "monotone";
  };

  type GridProps = {
    horizontal?: boolean;
    stroke?: string;
    vertical?: boolean;
  };

  type TooltipProps = {
    content?: ReactElement;
    cursor?: SVGProps<SVGElement> | { fill?: string };
  };

  type ResponsiveContainerProps = CommonProps & {
    height?: number | string;
    width?: number | string;
  };

  type LabelListProps = {
    content?: ReactElement;
  };

  type CellProps = {
    fill?: string;
  };

  export const Area: ComponentType<SeriesProps>;
  export const AreaChart: ComponentType<ChartProps>;
  export const Bar: ComponentType<SeriesProps>;
  export const BarChart: ComponentType<ChartProps>;
  export const CartesianGrid: ComponentType<GridProps>;
  export const Cell: ComponentType<CellProps>;
  export const LabelList: ComponentType<LabelListProps>;
  export const ResponsiveContainer: ComponentType<ResponsiveContainerProps>;
  export const Tooltip: ComponentType<TooltipProps>;
  export const XAxis: ComponentType<AxisProps>;
  export const YAxis: ComponentType<AxisProps>;
}
