/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { classNameFactory } from "@api/Styles";
import { Devs } from "@utils/constants";
import { getIntlMessage } from "@utils/discord";
import { runtimeHashMessageKey } from "@utils/intlHash";
import definePlugin, { OptionType } from "@utils/types";
import { Button, Forms, TextInput } from "@webpack/common";

const cl = classNameFactory("vc-bbr-");

function ReasonsComponent() {
    const { reasons } = settings.use(["reasons"]);

    return (
        <Forms.FormSection title="Reasons">
            {reasons.map((reason: string, index: number) => (
                <div
                    key={index}
                    className={cl("reason-wrapper")}
                >
                    <TextInput
                        type="text"
                        value={reason}
                        onChange={v => {
                            reasons[index] = v;
                            settings.store.reasons = [...reasons];
                        }}
                        placeholder="Reason"
                    />
                    <Button
                        color={Button.Colors.RED}
                        className={cl("remove-button")}
                        onClick={() => {
                            reasons.splice(index, 1);
                            settings.store.reasons = [...reasons];
                        }}
                    >
                        Remove
                    </Button>
                </div>
            ))}
            <Button
                onClick={() => {
                    settings.store.reasons = [...reasons, ""];
                }}
            >
                Add new
            </Button>
        </Forms.FormSection>
    );
}

const settings = definePluginSettings({
    reasons: {
        description: "Your custom reasons",
        type: OptionType.COMPONENT,
        default: [],
        component: ReasonsComponent,
    },
    isTextInputDefault: {
        type: OptionType.BOOLEAN,
        description: 'Shows a text input instead of a select menu by default. (Equivalent to clicking the "Other" option)'
    }
});

export default definePlugin({
    name: "BetterBanReasons",
    description: "Create custom reasons to use in the Discord ban modal, and/or show a text input by default instead of the options.",
    authors: [Devs.Inbestigator],
    patches: [
        {
            find: "." + runtimeHashMessageKey("BAN_MULTIPLE_CONFIRM_TITLE"),
            replacement: [{
                match: /\[(\{((?:name|value):\i\.intl\.string\(\i\.\i\.[A-Za-z0-9]+\),?){2}\},?){3}\]/,
                replace: "$self.getReasons()"
            },
            {
                match: /useState\(0\)(?=.{0,100}targetUserId:)/,
                replace: "useState($self.getDefaultState())"
            }]
        }
    ],
    getReasons() {
        const storedReasons = settings.store.reasons.filter((r: string) => r.trim());
        const reasons: string[] = storedReasons.length
            ? storedReasons
            : [
                getIntlMessage("BAN_REASON_OPTION_SPAM_ACCOUNT"),
                getIntlMessage("BAN_REASON_OPTION_HACKED_ACCOUNT"),
                getIntlMessage("BAN_REASON_OPTION_BREAKING_RULES"),
            ];
        return reasons.map(s => ({ name: s, value: s }));
    },
    getDefaultState: () => settings.store.isTextInputDefault ? 1 : 0,
    settings,
});
