import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @swagger
 * /schema:
 *   get:
 *     summary: Get the OpenAPI schema for MCP tool registration
 *     tags: [Schema]
 *     responses:
 *       200:
 *         description: OpenAPI schema for the weather tool
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/', (req: Request, res: Response) => {
  const schema = {
    openapi: '3.0.0',
    info: {
      title: 'Weather MCP Tool',
      version: '1.0.0',
      description: 'MCP tool for weather data retrieval',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5001}`,
        description: 'Development server',
      },
    ],
    paths: {
      '/weather/get': {
        post: {
          summary: 'Get weather information for a city',
          operationId: 'getWeather',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    city: {
                      type: 'string',
                      description: 'City name to get weather for',
                    },
                  },
                  required: ['city'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Weather information retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      city: { type: 'string' },
                      temperature: { type: 'number' },
                      condition: { type: 'string' },
                      humidity: { type: 'number' },
                      windSpeed: { type: 'number' },
                      timestamp: { type: 'string' },
                      unit: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/weather/forecast': {
        post: {
          summary: 'Get weather forecast for a city',
          operationId: 'getForecast',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    city: {
                      type: 'string',
                      description: 'City name to get forecast for',
                    },
                    days: {
                      type: 'number',
                      description: 'Number of days for forecast (1-7)',
                      default: 3,
                    },
                  },
                  required: ['city'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Weather forecast retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      city: { type: 'string' },
                      forecast: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            date: { type: 'string' },
                            temperature: { type: 'number' },
                            condition: { type: 'string' },
                            humidity: { type: 'number' },
                            windSpeed: { type: 'number' },
                          },
                        },
                      },
                      timestamp: { type: 'string' },
                      unit: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  };

  res.json(schema);
});

export { router as schemaRouter }; 