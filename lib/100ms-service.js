// lib/100ms-service.js - FINAL WORKING VERSION
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export class HMSService {
  constructor() {
    this.appAccessKey = process.env.HMS_APP_ACCESS_KEY;
    this.appSecret = process.env.HMS_APP_SECRET;
    this.managementToken = process.env.HMS_MANAGEMENT_TOKEN;
    this.templateId = process.env.HMS_TEMPLATE_ID || '68dfea1674147bd574bb46f6';
    this.baseURL = 'https://api.100ms.live/v2';
  }

  // Generate auth token for joining room
  async getAuthToken(roomId, userId, role = 'guest') {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      const payload = {
        access_key: this.appAccessKey,
        room_id: roomId, // This MUST be the 100ms-generated room ID
        user_id: userId,
        role: role,
        type: 'app',
        version: 2,
        jti: uuidv4(),
        iat: now,
        nbf: now,
        exp: now + (24 * 60 * 60)
      };

      const token = jwt.sign(payload, this.appSecret, {
        algorithm: 'HS256'
      });

      console.log('✅ Generated 100ms auth token for:', { roomId, userId, role });
      return token;
    } catch (error) {
      console.error('❌ Error generating 100ms token:', error);
      throw error;
    }
  }

  // Create room in 100ms and return the ACTUAL room ID
  async createRoom(name, description = '') {
    try {
      console.log('🔄 Creating room in 100ms:', { name });

      const response = await fetch(`${this.baseURL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.managementToken}`
        },
        body: JSON.stringify({
          name: name.substring(0, 100),
          description: description.substring(0, 200),
          template_id: this.templateId,
          region: 'in'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Room creation failed:', errorText);
        throw new Error(`Failed to create room: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Created 100ms room:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Error creating room:', error);
      throw error;
    }
  }

  // Get or create room for an appointment - RETURNS ACTUAL 100MS ROOM ID
  async getOrCreateAppointmentRoom(appointmentId) {
    try {
      const roomName = `Appointment ${appointmentId}`;
      console.log('🔄 Getting/Creating room for appointment:', appointmentId);
      
      // Always create a new room for each appointment
      const room = await this.createRoom(roomName, `Video consultation for appointment ${appointmentId}`);
      
      console.log('🎉 Appointment room created:', room.id);
      return {
        hmsRoomId: room.id,
        roomName: room.name
      };
    } catch (error) {
      console.error('❌ Error creating appointment room:', error);
      throw error;
    }
  }

  // Get room by ID
  async getRoom(roomId) {
    try {
      const response = await fetch(`${this.baseURL}/rooms/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${this.managementToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Room not found: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async endRoom(roomId, reason = 'Session ended') {
    try {
      const response = await fetch(`${this.baseURL}/active-rooms/${roomId}/end-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.managementToken}`
        },
        body: JSON.stringify({
          reason: reason,
          lock: false
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to end room: ${response.status}`);
      }

      console.log('✅ Ended room:', roomId);
      return await response.json();
    } catch (error) {
      console.error('❌ Error ending room:', error);
      throw error;
    }
  }

  // Test connection
  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL}/rooms`, {
        headers: {
          'Authorization': `Bearer ${this.managementToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`API test failed: ${response.status}`);
      }

      return {
        success: true,
        message: '✅ 100ms connection successful'
      };
    } catch (error) {
      return {
        success: false,
        error: `❌ 100ms connection failed: ${error.message}`
      };
    }
  }
}

export const hmsService = new HMSService();