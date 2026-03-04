import { WeightUnitEnum } from "../enums/weight-unit.enum";

export interface Preferences {
    /** Indicates whether to show all personal records or only the latest ones. */
    showAllPersonalRecords?: boolean;

    /** User's preferred weight unit for displaying records and calculations. */
    preferredUnits?: WeightUnitEnum;

    /** User's preferred barbell for lifting, including its weight and unit. */
    preferredBarbell?: {
        value: number;
        unit: WeightUnitEnum;
    }

    /** User's preferred weight unit for bumper plates suggestions. */
    preferredPlatesUnits?: WeightUnitEnum;

    /** User's preferred color scheme. */
    colorScheme?: 'auto' | 'light' | 'dark';
}