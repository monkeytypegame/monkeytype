module fwrisc_exec #(
    parameter ENABLE_COMPRESSED=1,
    parameter ENABLE_MUL_DIV=1,
    parameter ENABLE_DEP=1
    )(
    input clock,
    input reset,
    input decode_valid,
    output reg instr_complete,
    output reg trap,
    output reg tret,
    input instr_c,
    input[4:0] op_type,
    input[31:0] op_a,
    input[31:0] op_b,
    input[3:0] op,
    input[31:0] op_c,
    input[5:0] rd,
    output reg[5:0] rd_waddr,
    output reg[31:0] rd_wdata,
    output reg rd_wen,
    output reg[31:0] pc,
    output reg pc_seq,
    input[31:0] mtvec,
    input[31:0] dep_lo,
    input[31:0] dep_hi,
    output[31:0] daddr,
    output dvalid,
    output dwrite,
    output[31:0] dwdata,
    output[3:0] dwstb,
    input[31:0] drdata,
    input dready,
    input irq,
    input meie,
    input mie);
    parameter [3:0]
        OP_ADD = 4'd0,
        OP_SUB = (OP_ADD+4'd1),
        OP_AND = (OP_SUB+4'd1),
        OP_OR = (OP_AND+4'd1),
        OP_CLR = (OP_OR+4'd1),
        OP_EQ = (OP_CLR+4'd1),
        OP_NE = (OP_EQ+4'd1),
        OP_LT = (OP_NE+4'd1),
        OP_GE = (OP_LT+4'd1),
        OP_LTU = (OP_GE+4'd1),
        OP_GEU = (OP_LTU+4'd1),
        OP_OPA = (OP_GEU+4'd1),
        OP_OPB = (OP_OPA+4'd1),
        OP_XOR = (OP_OPB+4'd1);
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
    parameter [4:0]
        OP_TYPE_ARITH = 5'd0,
        OP_TYPE_BRANCH = (OP_TYPE_ARITH+5'd1),
        OP_TYPE_LDST = (OP_TYPE_BRANCH+5'd1),
        OP_TYPE_MDS = (OP_TYPE_LDST+5'd1),
        OP_TYPE_JUMP = (OP_TYPE_MDS+5'd1),
        OP_TYPE_SYSTEM = (OP_TYPE_JUMP+5'd1),
        OP_TYPE_CSR = (OP_TYPE_SYSTEM+5'd1);
    parameter [5:0]
        CSR_BASE_Q0 = 6'h20,
        CSR_MVENDORID = (CSR_BASE_Q0 + 1'd1),
        CSR_MARCHID = (CSR_MVENDORID + 1'd1),
        CSR_MIMPID = (CSR_MARCHID + 1'd1),
        CSR_MHARTID = (CSR_MIMPID + 1'd1),
        CSR_BASE_Q1 = 6'h28,
        CSR_MSTATUS = (CSR_BASE_Q1 + 1'd0),
        CSR_MISA = (CSR_MSTATUS + 1'd1),
        CSR_MEDELEG = (CSR_MISA + 1'd1),
        CSR_MIDELEG = (CSR_MEDELEG + 1'd1),
        CSR_MIE = (CSR_MIDELEG + 1'd1),
        CSR_MTVEC = (CSR_MIE + 1'd1),
        CSR_MCOUNTEREN = (CSR_MTVEC + 1'd1),
        CSR_BASE_Q2 = 6'h30,
        CSR_MSCRATCH = (CSR_BASE_Q2 + 1'd0),
        CSR_MEPC = (CSR_MSCRATCH + 1'd1),
        CSR_MCAUSE = (CSR_MEPC + 1'd1),
        CSR_MTVAL = (CSR_MCAUSE + 1'd1),
        CSR_MIP = (CSR_MTVAL + 1'd1),
        CSR_BASE_Q3 = 6'h38,
        CSR_MCYCLE = (CSR_BASE_Q3 + 1'd0),
        CSR_MCYCLEH = (CSR_MCYCLE + 1'd1),
        CSR_MINSTRET = (CSR_MCYCLEH + 1'd1),
        CSR_MINSTRETH = (CSR_MINSTRET + 1'd1),
        CSR_DEP_LO = (CSR_MINSTRETH + 1'd1),
        CSR_DEP_HI = (CSR_DEP_LO + 1'd1),
        CSR_SOFT_RESET = (CSR_DEP_HI + 1'd1);
    parameter [3:0]
        OP_TYPE_ECALL = 1'd0,
        OP_TYPE_EBREAK = (OP_TYPE_ECALL + 1'd1),
        OP_TYPE_ERET = (OP_TYPE_EBREAK + 1'd1);
    parameter [3:0]
        STATE_EXECUTE = 4'd0,
        STATE_BRANCH_TAKEN = (STATE_EXECUTE + 4'd1),
        STATE_JUMP = (STATE_BRANCH_TAKEN + 4'd1),
        STATE_CSR = (STATE_JUMP + 4'd1),
        STATE_MDS_COMPLETE = (STATE_CSR + 4'd1),
        STATE_LDST_COMPLETE = (STATE_MDS_COMPLETE + 4'd1),
        STATE_EXCEPTION_1 = (STATE_LDST_COMPLETE + 4'd1),
        STATE_EXCEPTION_2 = (STATE_EXCEPTION_1 + 4'd1),
        STATE_EXCEPTION_3 = (STATE_EXCEPTION_2 + 4'd1);
    reg [3:0] exec_state;
    reg[31:0] pc_next;
    reg pc_seq_next;
    wire mds_in_valid = (
        (op_type == OP_TYPE_MDS && exec_state == STATE_EXECUTE)
        && decode_valid
    );
    wire mds_out_valid;
    wire[31:0] mds_out;
    wire mem_req_valid;
    wire[31:0] mem_req_addr;
    wire mem_ack_valid;
    wire[31:0] mem_ack_data;
    reg[2:0] next_pc_seq_incr;
    reg mcause_int;
    reg[3:0] mcause;
    wire[31:0] next_pc_seq = pc + next_pc_seq_incr;
    reg[31:0] mtval = 0;
    wire [31:0] alu_out;
    wire dep_violation;
    generate
    if (ENABLE_DEP) begin
        assign dep_violation = (
            dep_lo[0] && dep_hi[0]
            && (exec_state == STATE_JUMP) 
            && !(alu_out[31:3] >= dep_lo[31:3] && alu_out[31:3] <= dep_hi[31:3])
        );
    end else begin
        assign dep_violation = 0;
    end
    endgenerate
    wire ei_req = (irq && meie && mie);
    wire jump_target_misaligned;
    generate
    if (!ENABLE_COMPRESSED) begin
        assign jump_target_misaligned = (
            (exec_state == STATE_JUMP || exec_state == STATE_BRANCH_TAKEN) 
            && alu_out[1]
        );
    end else begin
        assign jump_target_misaligned = 0;
    end
    endgenerate
    reg ldst_addr_misaligned;
    always @* begin
        if (exec_state == STATE_EXECUTE && op_type == OP_TYPE_LDST) begin
            case (op)
                OP_LH, OP_LHU, OP_SH: ldst_addr_misaligned = alu_out[0];
                OP_LW, OP_SW: ldst_addr_misaligned = |alu_out[1:0];
                default: ldst_addr_misaligned = 0;
            endcase
        end else begin
            ldst_addr_misaligned = 0;
        end
    end
    always @(posedge clock) begin
        if (reset) begin
            mtval <= 0;
        end else begin
            if (jump_target_misaligned || dep_violation || ldst_addr_misaligned) begin
                case (op_type)
                    OP_TYPE_JUMP: mtval <= {alu_out[31:1], 1'b0};
                    default: mtval <= alu_out;
                endcase
            end
        end
    end
    always @* begin
        if (exec_state == STATE_BRANCH_TAKEN || exec_state == STATE_JUMP) begin
            next_pc_seq_incr = 0;
        end else begin
            next_pc_seq_incr = (instr_c)?2:4;
        end
    end
    wire branch_taken = ((op_type == OP_TYPE_BRANCH && alu_out[0]) || op_type == OP_TYPE_JUMP);
    always @* begin
        if (exec_state == STATE_BRANCH_TAKEN || exec_state == STATE_JUMP) begin
            pc_next = {alu_out[31:1], 1'b0};
            pc_seq_next = 0;
        end else begin
            pc_next = next_pc_seq;
            pc_seq_next = 1;
        end
    end
    always @(posedge clock) begin
        if (reset) begin
            exec_state <= STATE_EXECUTE;
            instr_complete <= 1'b0;
            trap <= 1'b0;
            tret <= 1'b0;
            pc <= 'h8000_0000;
            pc_seq <= 1;
            mcause <= 4'b0;
            mcause_int <= 1'b0;
        end else begin
            case (exec_state)
                STATE_EXECUTE: begin
                    if (decode_valid) begin
                        if (ei_req) begin
                            exec_state <= STATE_EXCEPTION_1;
                            mcause <= 4'd11;
                            mcause_int <= 1'b1;
                        end else begin
                            case (op_type)
                                OP_TYPE_ARITH: begin
                                    pc <= pc_next;
                                    pc_seq <= pc_seq_next;
                                    instr_complete <= 1;
                                end
                                OP_TYPE_BRANCH: begin
                                    if (alu_out[0]) begin
                                        exec_state <= STATE_BRANCH_TAKEN;
                                    end else begin
                                        pc <= pc_next;
                                        pc_seq <= pc_seq_next;
                                        instr_complete <= 1;
                                    end
                                end
                                OP_TYPE_LDST: begin
                                    if (ldst_addr_misaligned) begin
                                        if (op == OP_SB || op == OP_SH || op == OP_SW) begin
                                            mcause <= 6; 
                                            mcause_int <= 1'b0;
                                        end else begin
                                            mcause <= 4; 
                                            mcause_int <= 1'b0;
                                        end
                                        exec_state <= STATE_EXCEPTION_1;
                                    end else begin
                                        exec_state <= STATE_LDST_COMPLETE;
                                    end
                                end
                                OP_TYPE_MDS: begin
                                    exec_state <= STATE_MDS_COMPLETE;
                                end
                                OP_TYPE_JUMP: begin
                                    exec_state <= STATE_JUMP;
                                end
                                OP_TYPE_SYSTEM: begin
                                    if (op == OP_TYPE_ERET) begin
                                        instr_complete <= 1'b1;
                                        tret <= 1'b1;
                                        pc <= op_a; 
                                        pc_seq <= 0;
                                        exec_state <= STATE_EXECUTE;
                                    end else begin
                                        mcause <= (op == OP_TYPE_EBREAK)?3:11;
                                        mcause_int <= 1'b0;
                                        exec_state <= STATE_EXCEPTION_1;
                                    end
                                end
                                default: begin
                                    exec_state <= STATE_CSR;
                                end
                            endcase
                        end
                    end else begin
                        instr_complete <= 1'b0;
                        trap <= 1'b0;
                        tret <= 1'b0;
                    end
                end
                STATE_CSR: begin
                    pc <= pc_next;
                    pc_seq <= pc_seq_next;
                    exec_state <= STATE_EXECUTE;
                    instr_complete <= 1;
                end
                STATE_JUMP: begin
                    case ({dep_violation, jump_target_misaligned})
                        2'b00: begin
                            pc <= {alu_out[31:1], 1'b0};
                            pc_seq <= 0;
                            exec_state <= STATE_EXECUTE;
                            instr_complete <= 1;
                        end
                        2'b01: begin
                            mcause <= 0;
                            mcause_int <= 1'b0;
                            exec_state <= STATE_EXCEPTION_1;
                        end
                        default: begin
                            mcause <= 1;
                            mcause_int <= 1'b0;
                            exec_state <= STATE_EXCEPTION_1;
                        end
                    endcase
                end
                STATE_BRANCH_TAKEN: begin
                    if (jump_target_misaligned) begin
                        mcause <= 0;
                        mcause_int <= 1'b0;
                        exec_state <= STATE_EXCEPTION_1;
                    end else begin
                        pc <= alu_out;
                        pc_seq <= pc_seq_next;
                        exec_state <= STATE_EXECUTE;
                        instr_complete <= 1;
                    end
                end
                STATE_MDS_COMPLETE: begin
                    if (mds_out_valid) begin
                        exec_state <= STATE_EXECUTE;
                        pc <= pc_next;
                        pc_seq <= pc_seq_next;
                        instr_complete <= 1;
                    end
                end
                STATE_LDST_COMPLETE: begin
                    if (mem_ack_valid) begin
                        exec_state <= STATE_EXECUTE;
                        pc <= pc_next;
                        pc_seq <= pc_seq_next;
                        instr_complete <= 1;
                    end
                end
                STATE_EXCEPTION_1: begin
                    exec_state <= STATE_EXCEPTION_2;
                end
                STATE_EXCEPTION_2: begin
                    exec_state <= STATE_EXCEPTION_3;
                end
                STATE_EXCEPTION_3: begin
                    pc <= mtvec;
                    pc_seq <= 1'b0;
                    instr_complete <= 1'b1;
                    trap <= 1'b1;
                    exec_state <= STATE_EXECUTE;
                end
            endcase
        end
    end
    wire alu_op_a_sel_pc = (
        (exec_state == STATE_BRANCH_TAKEN)
        || (exec_state == STATE_EXECUTE && op_type == OP_TYPE_JUMP)
    );
    wire alu_op_b_sel_c = (
        (exec_state == STATE_BRANCH_TAKEN)
        || (exec_state == STATE_JUMP)
        || (exec_state == STATE_EXECUTE && op_type == OP_TYPE_LDST)
    );
    wire alu_op_sel_add = (
        (exec_state == STATE_EXECUTE && op_type == OP_TYPE_LDST)
        || (exec_state == STATE_BRANCH_TAKEN)
        || (exec_state == STATE_JUMP)
    );
    wire alu_op_sel_opb = (
        (exec_state == STATE_CSR)
    );
    wire alu_op_sel_opa = (
        (exec_state == STATE_EXECUTE && op_type == OP_TYPE_JUMP)
        || (exec_state == STATE_JUMP)
    );
    wire [31:0] alu_op_a = (alu_op_a_sel_pc)?next_pc_seq:op_a;
    wire [31:0] alu_op_b = (alu_op_b_sel_c)?op_c:op_b;
    reg [3:0] alu_op;
    always @* begin
        case ({alu_op_sel_add,alu_op_sel_opb,alu_op_sel_opa})
            3'b100: alu_op = OP_ADD;
            3'b010: alu_op = OP_OPB;
            3'b001: alu_op = OP_OPA;
            default: alu_op = op;
        endcase
    end
    always @* begin
        rd_wen = (decode_valid && !instr_complete &&
                (
                    (exec_state == STATE_EXECUTE) && 
                        (op_type == OP_TYPE_ARITH || op_type == OP_TYPE_JUMP 
                            || op_type == OP_TYPE_CSR)
                    || (exec_state == STATE_CSR)
                    || (exec_state == STATE_LDST_COMPLETE 
                        && (op == OP_LB || op == OP_LH || op == OP_LW
                            || op == OP_LBU || op == OP_LHU) && mem_ack_valid)
                    || (exec_state == STATE_MDS_COMPLETE && mds_out_valid)
                    || (exec_state == STATE_EXCEPTION_1 || exec_state == STATE_EXCEPTION_2 || exec_state == STATE_EXCEPTION_3)
                )
        );
    end
    always @* begin
        case (exec_state)
            STATE_EXCEPTION_1: rd_wdata = pc;
            STATE_EXCEPTION_2: rd_wdata = mtval;
            STATE_EXCEPTION_3: rd_wdata = {mcause_int, 27'b0, mcause};
            STATE_MDS_COMPLETE: rd_wdata = mds_out;
            STATE_LDST_COMPLETE: rd_wdata = mem_ack_data;
            default: rd_wdata = alu_out;
        endcase
        case (exec_state)
            STATE_EXECUTE: rd_waddr = (op_type == OP_TYPE_CSR)?op_c[5:0]:rd;
            STATE_EXCEPTION_1: rd_waddr = CSR_MEPC;
            STATE_EXCEPTION_2: rd_waddr = CSR_MTVAL;
            STATE_EXCEPTION_3: rd_waddr = CSR_MCAUSE;
            default: rd_waddr = rd;
        endcase
    end
    fwrisc_alu u_alu (
        .clock (clock), 
        .reset (reset), 
        .op_a (alu_op_a), 
        .op_b (alu_op_b), 
        .op (alu_op), 
        .out (alu_out));
    fwrisc_mul_div_shift #(
        .ENABLE_MUL_DIV (ENABLE_MUL_DIV)
        ) u_mds (
        .clock (clock), 
        .reset (reset), 
        .in_a (op_a), 
        .in_b (op_b), 
        .op (op[3:0]), 
        .in_valid (mds_in_valid), 
        .out (mds_out), 
        .out_valid (mds_out_valid));
    assign mem_req_addr = alu_out;
    assign mem_req_valid = (
        exec_state == STATE_EXECUTE 
        && op_type == OP_TYPE_LDST
        && decode_valid && !ldst_addr_misaligned);
    fwrisc_mem u_mem (
        .clock (clock), 
        .reset (reset), 
        .req_valid (mem_req_valid), 
        .req_addr (mem_req_addr), 
        .req_op (op[3:0]), 
        .req_data (op_b), 
        .ack_valid (mem_ack_valid), 
        .ack_data (mem_ack_data), 
        .dvalid (dvalid), 
        .daddr (daddr), 
        .dwdata (dwdata), 
        .dwstb (dwstb), 
        .dwrite (dwrite), 
        .drdata (drdata), 
        .dready (dready));
endmodule