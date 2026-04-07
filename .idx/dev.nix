{ pkgs, ... }: {
  # Universal channel for 2026
  channel = "stable-24.11";

  # Hardware and Software Packages
  packages = [
    pkgs.nodejs_22
    pkgs.jdk21
    pkgs.nodePackages.firebase-tools
    pkgs.nodePackages.typescript-language-server
  ];

  # Environment Variables
  env = {
    # Ensures Capacitor can find the Java installation
    JAVA_HOME = "${pkgs.jdk21}";
  };

  idx = {
    # VS Code Extensions for mobile/web dev
    extensions = [
      "vscodevim.vim" # Optional, delete if you don't use Vim
      "esbenp.prettier-vscode"
      "dbaeumer.vscode-eslint"
    ];

    # Enable the mobile and web previews
    previews = {
      enable = true;
      previews = {
        # This will run your Next.js dev server
        web = {
          command = [ "npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0" ];
          manager = "web";
        };
        # This starts the Android Emulator
        android = {
          manager = "android";
        };
      };
    };

    # Commands to run when the workspace is first created
    workspace = {
      onCreate = {
        npm-install = "npm install";
      };
      # Commands to run every time you open the project
      onStart = {
        # Automatically syncs Capacitor when you open the editor
        sync-capacitor = "npx cap sync";
      };
    };
  };
}
