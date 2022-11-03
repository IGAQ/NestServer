import { Inject, Injectable } from "@nestjs/common";
import { Neo4jService } from "../../../neo4j/services/neo4j.service";
import { Comment } from "../../models";
import { RepliedProps } from "../../models/toSelf";
import { ICommentsRepository } from "./comments.repository.interface";
