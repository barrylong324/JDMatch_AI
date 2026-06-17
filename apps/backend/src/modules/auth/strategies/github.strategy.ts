import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy as GitHubStrategy } from 'passport-github2'
import { config } from '@jd-match/config'

@Injectable()
export class GitHubOAuthStrategy extends PassportStrategy(GitHubStrategy, 'github') {
    constructor() {
        if (
            !config.GITHUB_CLIENT_ID ||
            !config.GITHUB_CLIENT_SECRET ||
            !config.GITHUB_CALLBACK_URL
        ) {
            throw new Error(
                'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and GITHUB_CALLBACK_URL in .env',
            )
        }

        super({
            clientID: config.GITHUB_CLIENT_ID,
            clientSecret: config.GITHUB_CLIENT_SECRET,
            callbackURL: config.GITHUB_CALLBACK_URL,
            scope: ['user:email'],
        })
    }

    async validate(
        _accessToken: string,
        _refreshToken: string,
        profile: any,
    ): Promise<GitHubUserProfile> {
        const { id, displayName, username, emails, photos } = profile

        const primaryEmail = emails?.[0]?.value ?? null

        return {
            provider: 'github',
            providerId: id,
            email: primaryEmail,
            name: displayName || username || 'GitHub User',
            avatar: photos?.[0]?.value ?? null,
        }
    }
}

export interface GitHubUserProfile {
    provider: string
    providerId: string
    email: string | null
    name: string
    avatar: string | null
}
