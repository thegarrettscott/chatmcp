import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

/**
 * @swagger
 * /weather/get:
 *   post:
 *     summary: Get weather information for a city
 *     tags: [Weather]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               city:
 *                 type: string
 *                 description: City name to get weather for
 *                 example: "New York"
 *             required:
 *               - city
 *     responses:
 *       200:
 *         description: Weather information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 temperature:
 *                   type: number
 *                   description: Temperature in Celsius
 *                 condition:
 *                   type: string
 *                   description: Weather condition
 *                 humidity:
 *                   type: number
 *                   description: Humidity percentage
 *                 windSpeed:
 *                   type: number
 *                   description: Wind speed in km/h
 *       400:
 *         description: Bad request - city parameter missing
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/get', async (req: Request, res: Response) => {
  try {
    const { city } = req.body;

    if (!city) {
      return res.status(400).json({
        error: 'City parameter is required',
        code: 'MISSING_CITY_PARAMETER'
      });
    }

    // Mock weather data (in a real implementation, you'd call a weather API)
    const mockWeatherData = {
      temperature: Math.floor(Math.random() * 30) + 5, // 5-35°C
      condition: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
      humidity: Math.floor(Math.random() * 60) + 20, // 20-80%
      windSpeed: Math.floor(Math.random() * 30) + 5, // 5-35 km/h
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    res.json({
      city,
      ...mockWeatherData,
      timestamp: new Date().toISOString(),
      unit: 'metric'
    });

  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({
      error: 'Failed to fetch weather data',
      code: 'WEATHER_API_ERROR'
    });
  }
});

/**
 * @swagger
 * /weather/forecast:
 *   post:
 *   summary: Get weather forecast for a city
 *   tags: [Weather]
 *   security:
 *     - bearerAuth: []
 *   requestBody:
 *     required: true
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             city:
 *               type: string
 *               description: City name to get forecast for
 *               example: "New York"
 *             days:
 *               type: number
 *               description: Number of days for forecast (1-7)
 *               example: 3
 *           required:
 *             - city
 *   responses:
 *     200:
 *       description: Weather forecast retrieved successfully
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               city:
 *                 type: string
 *               forecast:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                     temperature:
 *                       type: number
 *                     condition:
 *                       type: string
 */
router.post('/forecast', async (req: Request, res: Response) => {
  try {
    const { city, days = 3 } = req.body;

    if (!city) {
      return res.status(400).json({
        error: 'City parameter is required',
        code: 'MISSING_CITY_PARAMETER'
      });
    }

    if (days < 1 || days > 7) {
      return res.status(400).json({
        error: 'Days parameter must be between 1 and 7',
        code: 'INVALID_DAYS_PARAMETER'
      });
    }

    // Mock forecast data
    const forecast = [];
    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        temperature: Math.floor(Math.random() * 25) + 10, // 10-35°C
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        humidity: Math.floor(Math.random() * 60) + 20,
        windSpeed: Math.floor(Math.random() * 25) + 5,
      });
    }

    res.json({
      city,
      forecast,
      timestamp: new Date().toISOString(),
      unit: 'metric'
    });

  } catch (error) {
    console.error('Forecast API error:', error);
    res.status(500).json({
      error: 'Failed to fetch forecast data',
      code: 'FORECAST_API_ERROR'
    });
  }
});

export { router as weatherRouter }; 