export interface ServerInfo {
  name: string;
  image: string;
  volumePath: string | null;
}

export interface BuildRequest {
  repoUrl: string;
  serverName: string;
  volumePath: string;
  dockerCommand?: string;
}
