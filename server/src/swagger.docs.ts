/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     AuthTokens:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *         refreshToken:
 *           type: string
 *     User:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         username:
 *           type: string
 *         fullName:
 *           type: string
 *         email:
 *           type: string
 *         avatarUrl:
 *           type: string
 *         birthDate:
 *           type: string
 *         gender:
 *           type: string
 *         phone:
 *           type: string
 *         city:
 *           type: string
 *         bio:
 *           type: string
 *         oauthProvider:
 *           type: string
 *     Post:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         text:
 *           type: string
 *         imageUrl:
 *           type: string
 *         commentsCount:
 *           type: integer
 *         likesCount:
 *           type: integer
 *         likedByMe:
 *           type: boolean
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 *         author:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *             username:
 *               type: string
 *             avatarUrl:
 *               type: string
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         postId:
 *           type: string
 *         text:
 *           type: string
 *         createdAt:
 *           type: string
 *         author:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *             username:
 *               type: string
 *             avatarUrl:
 *               type: string
 *     AiSearchLocalResult:
 *       type: object
 *       properties:
 *         postId:
 *           type: string
 *         title:
 *           type: string
 *         excerpt:
 *           type: string
 *         score:
 *           type: number
 *     AiExternalSource:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         snippet:
 *           type: string
 *         url:
 *           type: string
 *     AiAnswerSource:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         url:
 *           type: string
 *     AiAnswer:
 *       type: object
 *       properties:
 *         summary:
 *           type: string
 *         confidence:
 *           type: number
 *         sources:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AiAnswerSource'
 *     AiSearchLocalResponse:
 *       type: object
 *       properties:
 *         mode:
 *           type: string
 *           example: local
 *         results:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AiSearchLocalResult'
 *         threshold:
 *           type: number
 *         answer:
 *           $ref: '#/components/schemas/AiAnswer'
 *     AiSearchFallbackResponse:
 *       type: object
 *       properties:
 *         mode:
 *           type: string
 *           example: fallback
 *         message:
 *           type: string
 *         suggestions:
 *           type: object
 *           properties:
 *             keywords:
 *               type: array
 *               items:
 *                 type: string
 *             sources:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   queryUrl:
 *                     type: string
 *         external:
 *           type: object
 *           properties:
 *             wikipedia:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AiExternalSource'
 *         answer:
 *           $ref: '#/components/schemas/AiAnswer'
 */
export {};
