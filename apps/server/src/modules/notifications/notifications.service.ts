import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationQueryDto, CreateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(agentId: string, query: NotificationQueryDto) {
    const { unreadOnly, page = '1', limit = '20' } = query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { agentId };
    if (unreadOnly === 'true') {
      where.read = false;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      success: true,
      data: notifications,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async markAsRead(agentId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        agentId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return {
      success: true,
      data: updated,
    };
  }

  async markAllAsRead(agentId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        agentId,
        read: false,
      },
      data: { read: true },
    });

    return {
      success: true,
      message: `Marked ${result.count} notifications as read`,
    };
  }

  async getUnreadCount(agentId: string) {
    const count = await this.prisma.notification.count({
      where: {
        agentId,
        read: false,
      },
    });

    return {
      success: true,
      data: { count },
    };
  }

  async bulkMarkAsRead(agentId: string, notificationIds: string[]) {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        agentId,
        read: false,
      },
      data: { read: true },
    });

    return {
      success: true,
      message: `Marked ${result.count} notifications as read`,
    };
  }

  async create(createNotificationDto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        agentId: createNotificationDto.userId,
        type: createNotificationDto.type,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        data: JSON.stringify(createNotificationDto.data || {}),
        read: false,
      },
    });

    return notification;
  }
}
