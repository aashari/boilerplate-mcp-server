/**
 * Common type definitions shared across controllers.
 * These types provide a standard interface for controller interactions.
 * Centralized here to ensure consistency across the codebase.
 */

/**
 * Common response structure for controller operations.
 * All controller methods should return this structure.
 *
 * All output, including pagination information and any additional metadata,
 * is now consolidated into the content field as a single Markdown-formatted string.
 */
export interface ControllerResponse {
	/**
	 * Formatted content to be displayed to the user.
	 * A comprehensive Markdown-formatted string that includes all necessary information,
	 * including pagination details and any additional metadata.
	 */
	content: string;
}
