import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Inject, Param, ParseUUIDPipe } from "@nestjs/common";
import { ISexualityRepository } from "../repositories/sexuality/sexuality.repository.interface";
import { _$ } from "../../_domain/injectableTokens";
import { Sexuality } from "../models";

@ApiTags("sexualities")
@ApiBearerAuth()
@Controller("sexualities")
export class SexualitiesController {
    private readonly _sexualityRepository: ISexualityRepository;

    constructor(@Inject(_$.ISexualityRepository) sexualityRepository: ISexualityRepository) {
        this._sexualityRepository = sexualityRepository;
    }

    @Get("/")
    public async getSexualities(): Promise<Sexuality[]> {
        return await this._sexualityRepository.findAll();
    }

    @Get("/:sexualityId")
    public async getSexualityById(
        @Param("sexualityId", new ParseUUIDPipe()) sexualityId: UUID
    ): Promise<Sexuality> {
        return await this._sexualityRepository.findSexualityById(sexualityId);
    }
}
