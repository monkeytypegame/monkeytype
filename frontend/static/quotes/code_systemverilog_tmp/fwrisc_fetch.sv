module fwrisc_fetch #(
    parameter ENABLE_COMPRESSED=1
    )(
    input clock,
    input reset,
    input[31:0] next_pc,
    input next_pc_seq,
    output reg[31:0] iaddr,
    input[31:0] idata,
    output ivalid,
    input iready,
    output fetch_valid,
    input decode_complete,
    output reg[31:0] instr,
    output reg instr_c);
    reg[2:0] state;
    reg[15:0] instr_cache;
    wire instr_cache_c = (&instr_cache[1:0] != 1);
    reg instr_cache_valid;
    wire instr_c_lo = (&idata[1:0] != 1);
    wire instr_c_hi = (&idata[17:16] != 1);
    wire instr_c_next = (next_pc[1])?instr_c_hi:instr_c_lo;
    parameter [2:0]
        STATE_FETCH1 = 3'd0,
        STATE_FETCH2 = (STATE_FETCH1 + 3'd1),
        STATE_WAIT_DECODE = (STATE_FETCH2 + 3'd1);
    reg fetch_valid_r;
    assign fetch_valid = (fetch_valid_r && !decode_complete);
    reg ivalid_r;
    assign ivalid = (ivalid_r);
    always @(posedge clock) begin
        if (reset) begin
            state <= STATE_FETCH1;
            instr_cache_valid <= 0;
            instr_cache <= {16{1'b0}};
            fetch_valid_r <= 0;
            ivalid_r <= 0;
            instr_c <= 0;
            instr <= {32{1'b0}};
        end else begin
            case (state)
                default: begin
                    iaddr <= {next_pc[31:2], 2'b0};
                    if (iready && ivalid_r) begin
                        instr_c <= instr_c_next;
                        case ({next_pc[1], instr_c_next})
                            2'b00: begin
                                instr <= idata;
                                instr_cache_valid <= 0;
                                fetch_valid_r <= 1;
                                ivalid_r <= 0;
                                state <= STATE_WAIT_DECODE;
                            end
                            2'b01: begin
                                instr <= idata[15:0];
                                instr_cache <= idata[31:16];
                                instr_cache_valid <= 1;
                                fetch_valid_r <= 1;
                                ivalid_r <= 0;
                                state <= STATE_WAIT_DECODE;
                            end
                            2'b10: begin
                                instr[15:0] <= idata[31:16];
                                instr_cache_valid <= 0;
                                ivalid_r <= 1;
                                state <= STATE_FETCH2;
                            end
                            2'b11: begin
                                instr[15:0] <= idata[31:16];
                                instr_cache_valid <= 0;
                                ivalid_r <= 0;
                                state <= STATE_WAIT_DECODE; 
                            end
                        endcase
                    end else begin
                        ivalid_r <= 1;
                    end
                end   
                STATE_WAIT_DECODE: begin
                    if (decode_complete) begin
                        fetch_valid_r <= 0;
                        state <= STATE_FETCH1;
`ifdef UNDEFINED
                        if (!next_pc_seq) begin
                            instr_cache_valid <= 0;
                            state <= STATE_FETCH1;
                        end else begin
                            case ({instr_c, instr_cache_valid, instr_cache_c})
                                3'b111: begin 
                                    instr_cache_valid <= 0;
                                    instr <= instr_cache;
                                    instr_c <= 1;
                                    state <= 3'b001; 
                                end
                                default: begin
                                    instr_cache_valid <= 0;
                                    state <= STATE_FETCH1;
                                end
                            endcase
                        end
`endif
                    end
                end
                STATE_FETCH2: begin
                    iaddr <= {next_pc[31:2]+1'd1, 2'b0};
                    if (iready) begin
                        ivalid_r <= 0;
                        instr[31:16] <= idata[15:0];
                        instr_cache <= idata[31:16];
                        instr_cache_valid <= 1;
                        fetch_valid_r <= 1;
                        state <= STATE_WAIT_DECODE;
                    end
                end
            endcase
        end
    end
endmodule