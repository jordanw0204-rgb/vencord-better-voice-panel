/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findStoreLazy } from "@webpack";
import { ChannelStore, MediaEngineStore, UserStore, useStateFromStores, VoiceStateStore } from "@webpack/common";

const SpeakingStore = findStoreLazy("SpeakingStore");

export function isUserSpeaking(userId: string) {
    try {
        return Boolean(SpeakingStore.isSpeaking(userId));
    } catch {
        return false;
    }
}

export function useSpeakingKey(channelId: string | undefined) {
    // Subscribe to Discord's actual Flux store instead of waking up 20 times
    // per second. The string snapshot only changes for speakers in this call.
    return useStateFromStores([SpeakingStore, VoiceStateStore, MediaEngineStore, ChannelStore], () => {
        if (!channelId) return "";
        const ids = new Set(Object.values(VoiceStateStore.getVoiceStatesForChannel(channelId) ?? {})
            .map((state: any) => state.userId as string));
        const channel = ChannelStore.getChannel(channelId);
        if (channel?.isPrivate()) {
            for (const id of channel.recipients ?? []) ids.add(id);
            const currentId = UserStore.getCurrentUser()?.id;
            if (currentId) ids.add(currentId);
        }
        return [...ids].filter(isUserSpeaking).sort().join("|");
    }, [channelId]);
}
