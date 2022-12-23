import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    Inject,
    Param,
    ParseUUIDPipe,
    UseInterceptors,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IGenderRepository } from "../repositories/gender/gender.repository.interface";
import { _$ } from "../../_domain/injectableTokens";
import { Gender } from "../models";

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags("genders")
@ApiBearerAuth()
@Controller("genders")
export class GendersController {
    private readonly _genderRepository: IGenderRepository;

    constructor(@Inject(_$.IGenderRepository) genderRepository: IGenderRepository) {
        this._genderRepository = genderRepository;
    }

    @Get("/")
    public async getGenders(): Promise<Gender[]> {
        return await this._genderRepository.findAll();
    }

    @Get("/:genderId")
    public async getGenderById(
        @Param("genderId", new ParseUUIDPipe()) genderId: UUID
    ): Promise<Gender> {
        return await this._genderRepository.findGenderById(genderId);
    }
}
