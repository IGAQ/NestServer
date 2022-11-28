import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Inject, Param, ParseUUIDPipe } from "@nestjs/common";
import { IOpennessRepository } from "../repositories/openness/openness.repository.interface";
import { _$ } from "../../_domain/injectableTokens";
import { Openness } from "../models";

@ApiTags("openness")
@ApiBearerAuth()
@Controller("openness")
export class OpennessController {
    private readonly _opennessRepository: IOpennessRepository;

    constructor(@Inject(_$.IOpennessRepository) opennessRepository: IOpennessRepository) {
        this._opennessRepository = opennessRepository;
    }

    @Get("/")
    public async getOpennesses(): Promise<Openness[]> {
        return await this._opennessRepository.findAll();
    }

    @Get("/:opennessId")
    public async getOpennessById(
        @Param("opennessId", new ParseUUIDPipe()) opennessId: UUID
    ): Promise<Openness> {
        return await this._opennessRepository.findOpennessById(opennessId);
    }
}
