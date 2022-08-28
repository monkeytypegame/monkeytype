module fwrisc_regfile #(
    parameter ENABLE_COUNTERS=1,
    parameter ENABLE_DEP=1,
    parameter[31:0] VENDORID=0,
    parameter[31:0] ARCHID=0,
    parameter[31:0] IMPID=0,
    parameter[31:0] HARTID=0,
    parameter[31:0] ISA=0
    )(
    input clock,
    input reset,
    output soft_reset_req,
    input instr_complete,
    input trap,
    input tret,
    input irq,
    input[5:0] ra_raddr,
    output reg[31:0] ra_rdata,
    input[5:0] rb_raddr,
    output reg[31:0] rb_rdata,
    input[5:0] rd_waddr,
    input[31:0] rd_wdata,
    input rd_wen,
    output[31:0] dep_lo,
    output[31:0] dep_hi,
    output[31:0] mtvec,
    output reg meie,
    output reg mie);
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
    reg[63:0] cycle_count;
    reg[63:0] instr_count;
    reg[31:0] dep_lo_r;
    reg[31:0] dep_hi_r;
    reg[31:0] mtvec_r;
    reg[31:0] mscratch;
    reg[31:0] regs['h3f:0];
    generate
    if (ENABLE_DEP) begin
        assign dep_lo = dep_lo_r;
        assign dep_hi = dep_hi_r;
    end else begin
        assign dep_lo = 0;
        assign dep_hi = 0;
    end
    endgenerate
    assign mtvec = mtvec_r;
`ifdef FORMAL
    initial regs[0] = 0;
`else
    `ifdef FWRISC_SOFT_CORE
    initial begin
        $readmemh("regs.hex", regs);
    end
    `endif
`endif
    reg mpie;
    assign soft_reset_req = (rd_wen && rd_waddr == CSR_SOFT_RESET);
    integer reg_i;
    always @(posedge clock) begin
        if (reset) begin
            cycle_count <= 0;
            instr_count <= 0;
            dep_lo_r <= 0;
            dep_hi_r <= 0;
            mtvec_r <= 0;
            mscratch <= {32{1'b0}};
            mtvec_r <= {32{1'b0}};
            meie <= 1'b1;
            mie <= 1'b1;
            mpie <= 1'b0;
            `ifndef FWRISC_SOFT_CORE
            for (reg_i=0; reg_i<'h40; reg_i=reg_i+1) begin
                regs[reg_i] <= {32{1'b0}};
            end
            `endif
        end else begin
            case ({rd_wen, rd_waddr})
                {1'b1, CSR_MCYCLE}: cycle_count <= {cycle_count[63:32], rd_wdata};
                {1'b1, CSR_MCYCLEH}: cycle_count <= {rd_wdata, cycle_count[31:0]};
                default: cycle_count <= cycle_count + 1;
            endcase
            case ({rd_wen, rd_waddr})
                {1'b1, CSR_MINSTRET}: instr_count <= {instr_count[63:32], rd_wdata};
                {1'b1, CSR_MINSTRETH}: instr_count <= {rd_wdata, instr_count[31:0]};
                default: instr_count <= (instr_complete)?(instr_count + 1):instr_count;
            endcase
            if (trap) begin
                mpie <= mie;
                mie <= 1'b0;
            end
            if (tret) begin
                mie <= mpie;
                mpie <= 1'b0;
            end
            if (rd_wen && rd_waddr == CSR_DEP_LO && !dep_lo_r[1]) begin
                dep_lo_r <= rd_wdata;
            end
            if (rd_wen && rd_waddr == CSR_DEP_HI && !dep_hi_r[1]) begin
                dep_hi_r <= rd_wdata;
            end
            if (rd_wen && rd_waddr == CSR_MTVEC) begin
                mtvec_r <= rd_wdata;
            end
            if (rd_wen && rd_waddr == CSR_MIE) begin
                meie <= rd_wdata[11];
            end
            if (rd_wen && rd_waddr == CSR_MSTATUS) begin
                mie <= rd_wdata[3];
                mpie <= rd_wdata[7];
            end
        end
    end
    always @(posedge clock) begin
        if (rd_wen) begin
            if (|rd_waddr) begin
                regs[rd_waddr] <= rd_wdata;
            end else begin
                if (rd_waddr != 0) begin
                    $display("Warning: skipping write to %0d", rd_waddr);
                end
            end
        end
        case (ra_raddr) 
            6'b0: ra_rdata <= {32{1'b0}};
            CSR_MVENDORID: ra_rdata <= VENDORID;
            CSR_MARCHID: ra_rdata <= ARCHID;
            CSR_MIMPID: ra_rdata <= IMPID;
            CSR_MHARTID: ra_rdata <= HARTID;
            CSR_MISA: ra_rdata <= {2'b01, ISA[29:0]};
            CSR_MIE: ra_rdata <= {20'b0, meie, 11'b0};
            CSR_MCYCLE: ra_rdata <= cycle_count[31:0];
            CSR_MCYCLEH: ra_rdata <= cycle_count[63:32];
            CSR_MINSTRET: ra_rdata <= instr_count[31:0];
            CSR_MINSTRETH: ra_rdata <= instr_count[63:32];
            CSR_MTVEC: ra_rdata <= mtvec_r;
            CSR_MSCRATCH: ra_rdata <= mscratch;
            CSR_MIP: ra_rdata <= {20'b0, irq, 11'b0};
            default: ra_rdata <= regs[ra_raddr[5:0]];
        endcase
        case (rb_raddr)
            0: rb_rdata <= {32{1'b0}};
            CSR_MVENDORID: rb_rdata <= VENDORID;
            CSR_MARCHID: rb_rdata <= ARCHID;
            CSR_MIMPID: rb_rdata <= IMPID;
            CSR_MHARTID: rb_rdata <= HARTID;
            CSR_MISA: rb_rdata <= {2'b01, ISA[29:0]};
            CSR_MIE: rb_rdata <= {20'b0, meie, 11'b0};
            CSR_MSTATUS: rb_rdata <= {{24{1'b0}}, mpie, {3{1'b0}}, mie, {3{1'b0}}};
            CSR_MCYCLE: rb_rdata <= cycle_count[31:0];
            CSR_MCYCLEH: rb_rdata <= cycle_count[63:32];
            CSR_MINSTRET: rb_rdata <= instr_count[31:0];
            CSR_MINSTRETH: rb_rdata <= instr_count[63:32];
            CSR_MTVEC: rb_rdata <= mtvec_r;
            CSR_MSCRATCH: rb_rdata <= mscratch;
            CSR_MIP: rb_rdata <= {20'b0, irq, 11'b0};
            default: rb_rdata <= regs[rb_raddr[5:0]];
        endcase
    end
endmodule