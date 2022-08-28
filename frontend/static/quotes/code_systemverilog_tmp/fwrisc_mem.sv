module fwrisc_mem (
    input clock,
    input reset,
    input req_valid,
    input[31:0] req_addr,
    input[3:0] req_op,
    input[31:0] req_data,
    output reg ack_valid,
    output reg[31:0] ack_data,
    output reg dvalid,
    output reg[31:0] daddr,
    output reg[31:0] dwdata,
    output reg[3:0] dwstb,
    output reg dwrite,
    input[31:0] drdata,
    input dready);
    parameter [3:0]
        OP_LB = 4'd0,
        OP_LH = (OP_LB+4'd1),
        OP_LW = (OP_LH+4'd1),
        OP_LBU = (OP_LW+4'd1),
        OP_LHU = (OP_LBU+4'd1),
        OP_SB = (OP_LHU + 4'd1),
        OP_SH = (OP_SB + 4'd1),
        OP_SW = (OP_SH + 4'd1),
        OP_NUM_MEM = (OP_SW + 4'd1);
    parameter[1:0]
        STATE_WAIT_REQ = 2'd0,
        STATE_WAIT_RSP = (STATE_WAIT_REQ + 2'd1);
    reg[1:0] mem_state;
    always @(posedge clock) begin
        if (reset) begin
            ack_valid <= 0;
            ack_data <= {32{1'b0}};
            mem_state <= 0;
            dvalid <= 0;
            daddr <= 0;
            dwdata <= 0;
            dwstb <= 0;
            dwrite <= 0;
        end else begin
            case (mem_state)
                STATE_WAIT_REQ: begin
                    ack_valid <= 0;
                    if (req_valid && !ack_valid) begin
                        dvalid <= 1;
                        daddr <= req_addr;
                        mem_state <= STATE_WAIT_RSP;
                        dwrite <= (req_op == OP_SB || req_op == OP_SH || req_op == OP_SW);
                        case (req_op)
                            OP_SB: begin
                                case (req_addr[1:0])
                                    2'b00: dwstb <= 4'b0001;
                                    2'b01: dwstb <= 4'b0010;
                                    2'b10: dwstb <= 4'b0100;
                                    2'b11: dwstb <= 4'b1000;
                                endcase
                                dwdata <= {4{req_data[7:0]}};
                            end
                            OP_SH: begin
                                case (req_addr[1])
                                    0: dwstb <= 4'b0011;
                                    1: dwstb <= 4'b1100;
                                endcase
                                dwdata <= {2{req_data[15:0]}};
                            end
                            OP_SW: begin
                                dwstb <= 4'b1111;
                                dwdata <= req_data;
                            end
                            default: begin
                                dwstb <= 4'b0000;
                                dwdata <= 32'b0;
                            end
                        endcase
                    end
                end
                default: begin
                    if (dready) begin
                        ack_valid <= 1;
                        dvalid <= 0;
                        dwrite <= 0;
                        dwstb <= 0;
                        case (req_op)
                            OP_LB: begin
                                case (daddr[1:0])
                                    2'b00: ack_data <= $signed(drdata[7:0]);
                                    2'b01: ack_data <= $signed(drdata[15:8]);
                                    2'b10: ack_data <= $signed(drdata[23:16]);
                                    2'b11: ack_data <= $signed(drdata[31:24]);
                                endcase
                            end
                            OP_LBU: begin
                                case (daddr[1:0])
                                    2'b00: ack_data <= drdata[7:0];
                                    2'b01: ack_data <= drdata[15:8];
                                    2'b10: ack_data <= drdata[23:16];
                                    2'b11: ack_data <= drdata[31:24];
                                endcase
                            end
                            OP_LH: begin
                                case (daddr[1])
                                    0: ack_data <= $signed(drdata[15:0]);
                                    1: ack_data <= $signed(drdata[31:16]);
                                endcase
                            end
                            OP_LHU: begin
                                case (daddr[1])
                                    0: ack_data <= drdata[15:0];
                                    1: ack_data <= drdata[31:16];
                                endcase
                            end
                            default: begin
                                ack_data <= drdata;
                            end
                        endcase
                        mem_state <= STATE_WAIT_REQ;
                    end
                end
            endcase
        end
    end
endmodule