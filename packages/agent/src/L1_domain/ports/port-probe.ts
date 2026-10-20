/** Whether another program already listens on a port of this computer. */
export interface PortProbe {
  /** True when the agent could listen on the port right now. */
  isFree(port: number): Promise<boolean>;
}
