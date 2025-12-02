import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { HelperProfileDto } from './dto/helper-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async getPublicProfile(id: string): Promise<Partial<User>> {
    const user = await this.findById(id);
    return {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      profileImage: user.profileImage,
      isHelper: user.isHelper,
      isRequester: user.isRequester,
      bio: user.bio,
      skills: user.skills,
      availableAreas: user.availableAreas,
      ratingAsRequester: user.ratingAsRequester,
      ratingAsHelper: user.ratingAsHelper,
      reviewCount: user.reviewCount,
      createdAt: user.createdAt,
    };
  }

  async update(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);

    // Check nickname uniqueness if being updated
    if (updateUserDto.nickname && updateUserDto.nickname !== user.nickname) {
      const existingNickname = await this.userRepository.findOne({
        where: { nickname: updateUserDto.nickname },
      });
      if (existingNickname) {
        throw new ConflictException('이미 사용 중인 닉네임입니다');
      }
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async activateHelperProfile(
    userId: string,
    helperProfileDto: HelperProfileDto,
  ): Promise<User> {
    const user = await this.findById(userId);

    user.isHelper = true;
    user.skills = helperProfileDto.skills;
    user.availableAreas = helperProfileDto.availableAreas;

    if (helperProfileDto.bio) {
      user.bio = helperProfileDto.bio;
    }
    if (helperProfileDto.bankName) {
      user.bankName = helperProfileDto.bankName;
    }
    if (helperProfileDto.bankAccount) {
      user.bankAccount = helperProfileDto.bankAccount;
    }
    if (helperProfileDto.accountHolder) {
      user.accountHolder = helperProfileDto.accountHolder;
    }

    return this.userRepository.save(user);
  }

  async updateRating(
    userId: string,
    type: 'requester' | 'helper',
    newRating: number,
  ): Promise<void> {
    const user = await this.findById(userId);

    if (type === 'requester') {
      const totalRating =
        user.ratingAsRequester * user.reviewCount + newRating;
      user.reviewCount += 1;
      user.ratingAsRequester = totalRating / user.reviewCount;
    } else {
      const totalRating = user.ratingAsHelper * user.reviewCount + newRating;
      user.reviewCount += 1;
      user.ratingAsHelper = totalRating / user.reviewCount;
    }

    await this.userRepository.save(user);
  }
}
