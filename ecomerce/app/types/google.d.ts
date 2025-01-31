declare namespace google {
    namespace accounts {
        namespace id {
            interface CredentialResponse {
                credential: string;
                select_by: string;
                client_id: string;
            }

            interface GsiButtonConfiguration {
                type?: 'standard' | 'icon';
                theme?: 'outline' | 'filled_blue' | 'filled_black';
                size?: 'large' | 'medium' | 'small';
                text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
                shape?: 'rectangular' | 'pill' | 'circle' | 'square';
                logo_alignment?: 'left' | 'center';
                width?: string | number;
                local?: string;
            }

            function initialize(config: {
                client_id: string;
                callback: (response: CredentialResponse) => void;
                context?: string;
            }): void;

            function renderButton(
                parent: HTMLElement,
                options: GsiButtonConfiguration
            ): void;

            function prompt(): void;
        }
    }
}
