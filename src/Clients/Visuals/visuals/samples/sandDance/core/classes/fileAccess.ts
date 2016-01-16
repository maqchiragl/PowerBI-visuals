﻿///-----------------------------------------------------------------------------------------------------------------
/// fileAccess.ts.  Copyright (c) 2015 Microsoft Corporation.
///     Part of the beachParty library - functions to read and write files.
///-----------------------------------------------------------------------------------------------------------------

/// <reference path="../_references.ts" />

module beachParty
{
    export enum fileFormat
    {
        text,
        json,
        csv,
        odata,
        excelSheet,
        excelAllSheets,
        // sql,
    }

    export interface CsvFormatOptions 
    {
        hasHeader: boolean;
        sepChar: string;
        findTypes: boolean;
    }

    export class FileAccess
    {
        /** reads a local text file that is selected by the user. */
        public static readLocalTextFile(userPrompt: string, callback)
        {
            //---- add an file input elem so we can promp user for file ----
            var fileElem = document.createElement("input");
            fileElem.setAttribute("type", "file");
            fileElem.style.display = "none";

            //fileElem.setAttribute("name", "buildNum.txt");
            //fileElem.setAttribute("type", "text/*");
            //fileElem.setAttribute("value", "myValue");

            document.body.appendChild(fileElem);

            //---- click on it to invoke the dialog ----
            fileElem.click();

            //---- remove the fileElem ----
            document.body.removeChild(fileElem);

            //---- now, initiate the async read ----
            var reader = new FileReader();
            reader.onload = function (f)
            {
                callback(reader.result);
            };

            var started = false;

            if (fileElem.files.length)
            {
                var file = fileElem.files[0];
                reader.readAsText(file);
                started = true;
            }

            return started;
        }

        public static mapToUrlParams(map)
        {
            var str = "";

            if (map)
            {
                for (var key in map)
                {
                    if (str === "")
                    {
                        str = "?";
                    }
                    else
                    {
                        str += "&";
                    }

                    str += key + "=" + map[key];
                }
            }

            return str;
        }

        /** write a local text file whose filename/path is selected by the user. */
        //public static writeLocalTextFile(userPrompt: string, text: string)
        //{
        //    //---- add an file input elem so we can promp user for file ----
        //    var fileElem = document.createElement("input");
        //    fileElem.setAttribute("type", "file");
        //    fileElem.style.display = "none";

        //    //fileElem.setAttribute("name", "buildNum.txt");
        //    //fileElem.setAttribute("type", "text/*");
        //    //fileElem.setAttribute("value", "myValue");

        //    document.body.appendChild(fileElem);

        //    //---- click on it to invoke the dialog ----
        //    fileElem.click();

        //    //---- remove the fileElem ----
        //    document.body.removeChild(fileElem);

        //    //---- now, initiate the async read ----
        //    var reader = new MSFileSaver();
        //    reader.onload = function (f)
        //    {
        //        callback(reader.result);
        //    };

        //    var started = false;

        //    if (fileElem.files.length)
        //    {
        //        var file = fileElem.files[0];
        //        reader.readAsText(file);
        //        started = true;
        //    }

        //    return started;
        //}

        public static writeFile64(fn: string, content64: string)
        {
            var vp = bpServerPath();
            var serviceUrl = vp + "/putData.asmx/writeFile64";

            var fullUrl = serviceUrl;
            var finalUrl = encodeURI(fullUrl);

            //alert("posting to url: " + finalUrl);

            var body = "fn=" + fn + "&content=" + content64;

            FileAccess.httpPost(finalUrl, body, function (xmlhttp)
            {
                //alert("writeFile64 succeeded");
            },
                function (e)
                {
                    //alert("writeFile64 failed");
                }, false);
        }

        public static writeFileText(fn: string, text: string, successCallback?: any, failureCallback?: any)
        {
            var vp = bpServerPath();
            var serviceUrl = vp + "/putData.asmx/writeFileText";

            var fullUrl = serviceUrl;
            var finalUrl = encodeURI(fullUrl);

            //alert("posting to url: " + finalUrl);

            var body = "fn=" + fn + "&text=" + encodeURIComponent(text);
            var isAsync = (successCallback !== undefined);

            FileAccess.httpPost(finalUrl, body,
                function (xmlhttp)
                {
                    if (successCallback)
                    {
                        successCallback(xmlhttp);
                    }
                },
                function (e)
                {
                    if (failureCallback)
                    {
                        failureCallback(e);
                    }
                }, isAsync);
        }

        public static removeDirectory(dir: string)
        {
            var vp = bpServerPath();
            var serviceUrl = vp + "/putData.asmx/removeDirectory";

            var fullUrl = serviceUrl;
            var finalUrl = encodeURI(fullUrl);

            //alert("posting to url: " + finalUrl);

            var body = "dir=" + dir;

            FileAccess.httpPost(finalUrl, body, function (xmlhttp)
            {
                //alert("writeFile64 succeeded");
            },
                function (e)
                {
                    //alert("writeFile64 failed");
                }, false);
        }

        /** replace every /Date/ value with a javaScript date object. */
        public static fixUpDatesFromDotNet(data: any)
        {
            var keys = null;

            if (data.length)
            {
                //---- JSON array of records ----
                for (var r = 0; r < data.length; r++)
                {
                    var record = data[r];

                    if (!keys)
                    {
                        keys = vp.utils.keys(record);
                    }

                    for (var k = 0; k < keys.length; k++)
                    {
                        var colName = keys[k];
                        var value = record[colName];

                        if (vp.utils.isString(value))
                        {
                            var str = <string>value;
                            if (str.startsWith("/Date("))
                            {
                                str = "new " + str.substr(1, str.length - 2);
                                /* tslint:disable */
                                var date = eval(str);
                                /* tslint:enable */
                                record[colName] = date;
                            }
                        }
                    }

                }
            }
            else if (data._vectorsByName)
            {
                //---- DATA FRAME class ----
                var df = <DataFrameClass>data;

                //---- process by vector ----
                var names = df.getNames();

                for (var v = 0; v < names.length; v++)
                {
                    var name = names[v];
                    var vector = df.getVector(name, true);

                    for (var r = 0; r < vector.length; r++)
                    {
                        var value = vector[r];

                        if (vp.utils.isString(value))
                        {
                            var str = <string>value;
                            if (str.startsWith("/Date("))
                            {
                                str = "new " + str.substr(1, str.length - 2);
                                /* tslint:disable */
                                var date = eval(str);
                                /* tslint:enable */
                                vector[r] = date;
                            }
                        }
                    }
                }
            }
            else if (data)
            {
                //---- KEY/VECTOR dict ----
                var names = vp.utils.keys(data);

                for (var v = 0; v < names.length; v++)
                {
                    var name = names[v];
                    var vector = <any[]> data[name];

                    for (var r = 0; r < vector.length; r++)
                    {
                        var value = vector[r];

                        if (vp.utils.isString(value))
                        {
                            var str = <string>value;
                            if (str.startsWith("/Date("))
                            {
                                str = "new " + str.substr(1, str.length - 2);
                                /* tslint:disable */
                                var date = eval(str);
                                /* tslint:enable */
                                vector[r] = date;
                            }
                        }
                    }
                }
            }

            return data;
        }

        public static readFile(fnOrUlr: string, format?: fileFormat, formatOptions?: any,
            asyncSuccessCallback?: any, asyncFailCallback?: any, noCache?: boolean, asDataFrame?: boolean, addDataPathIfNeeded = true)
        {
            //vp.utils.debug("readFile() called");

            format = format || fileFormat.text;        // default to TEXT
            var isJson = ((format === fileFormat.json) || (format === fileFormat.odata));

            if (addDataPathIfNeeded && !fnOrUlr.contains(":"))
            {
                fnOrUlr = bpDataPath() + "/" + fnOrUlr;
            }

            var result = undefined;

            if (format === fileFormat.csv)
            {
                
                var sourceData = `Name	Class	Joined	Job	TicketCost	Age	Gender	Survived	Department
"ALLEN, Miss Elisabeth Walton"	1st Class Passenger	Southampton		214.0375	29	Female	True	
"ALLISON, Mr Hudson Joshua Creighton"	1st Class Passenger	Southampton	Businessman	151.8	30	Male	False	
"ALLISON, Mrs Bessie Waldo"	1st Class Passenger	Southampton		151.8	25	Female	False	
"ALLISON, Miss Helen Loraine"	1st Class Passenger	Southampton		151.8	2	Female	False	
"ALLISON, Master Hudson Trevor"	1st Class Passenger	Southampton		151.8	0.916666667	Male	True	
"ANDERSON, Mr Harry"	1st Class Passenger	Southampton	Stockbroker	26.55	47	Male	True	
"ANDREWS, Miss Kornelia Theodosia"	1st Class Passenger	Cherbourg		77.95833333	62	Female	True	
"ANDREWS, Mr Thomas"	1st Class Passenger	Belfast	Shipbuilder	0	39	Male	False	H&W Guarantee Group
"APPLETON, Mrs Charlotte"	1st Class Passenger	Southampton		51.47916667	53	Female	True	
"ARTAGAVEYTIA, Mr Ramon"	1st Class Passenger	Cherbourg	Businessman	49.50416667	71	Male	False	
"ASTOR, Colonel John Jacob"	1st Class Passenger	Cherbourg	Property Developer / Real Estate	247.525	47	Male	False	
"ASTOR, Mrs Madeleine Talmage"	1st Class Passenger	Cherbourg		247.525	18	Female	True	
"AUBART, Mme. Léontine Pauline"	1st Class Passenger	Cherbourg	Singer	69.3	24	Male	True	
"ØSTBY, Miss Helen Ragnhild"	1st Class Passenger	Southampton		61.97916667	22	Female	True	
"BARBER, Miss Ellen Mary"	1st Class Passenger	Southampton	Personal Maid	78.85	26	Female	True	Servant
"BARKWORTH, Mr Algernon Henry"	1st Class Passenger	Southampton	Justice of the Peace	30	47	Male	True	
"BASSANI, Mrs Albina"	1st Class Passenger	Cherbourg	Personal Maid	76.29166667	32	Female	True	Servant
"BAUMANN, Mr John D."	1st Class Passenger	Cherbourg	Businessman	25.925	60	Male	False	
"BAXTER, Mrs Hélène"	1st Class Passenger	Cherbourg		247.5208333	50	Female	True	
"BAXTER, Mr Quigg Edmond"	1st Class Passenger	Cherbourg		247.5208333	24	Male	False	
"BEATTIE, Mr Thomson"	1st Class Passenger	Southampton	Landowner	75.24166667	36	Male	False	
"BECKWITH, Mr Richard Leonard"	1st Class Passenger	Southampton		52.55416667	37	Male	True	
"BECKWITH, Mrs Sallie"	1st Class Passenger	Southampton		52.55416667	46	Female	True	
"BEHR, Mr Karl Howell"	1st Class Passenger	Cherbourg		30	26	Male	True	
"BESSETTE, Miss Nellie Mayo"	1st Class Passenger	Cherbourg	Personal Maid	63.35833333	39	Female	True	Servant
"BIDOIS, Miss Rosalie"	1st Class Passenger	Cherbourg	Personal Maid	247.525	46	Female	True	Servant
"BIRD, Miss Ellen"	1st Class Passenger	Southampton	Personal Maid	221.7791667	31	Female	True	Servant
"BIRNBAUM, Mr Jakob"	1st Class Passenger	Cherbourg		26	24	Male	False	
"BISHOP, Mr Dickinson H."	1st Class Passenger	Cherbourg		91.07916667	25	Male	True	
"BISHOP, Mrs Helen"	1st Class Passenger	Cherbourg		91.07916667	19	Female	True	
"BJöRNSTRöM-STEFFANSSON, Mr Mauritz Hokan"	1st Class Passenger	Southampton	Businessman	26.55	28	Male	True	
"BLACKWELL, Mr Stephen Weart"	1st Class Passenger	Southampton		35.5	45	Male	False	
"BLANK, Mr Henry"	1st Class Passenger	Cherbourg	Jeweller	31	39	Male	True	
"BONNELL, Miss Caroline"	1st Class Passenger	Southampton		164.8666667	30	Female	True	
"BONNELL, Miss Elizabeth"	1st Class Passenger	Southampton		26.55	61	Female	True	
"BOREBANK, Mr John James"	1st Class Passenger	Southampton	Property Developer / Real Estate	26.55	42	Male	False	
"BOWEN, Miss Grace Scott"	1st Class Passenger	Cherbourg	Governess	262.375	45	Female	True	Servant
"BOWERMAN, Miss Elsie Edith"	1st Class Passenger	Southampton		55	22	Female	True	
"BRADY, Mr John Bertram"	1st Class Passenger	Southampton		30.5	41	Male	False	
"BRANDEIS, Mr Emil"	1st Class Passenger	Cherbourg		50.49583333	48	Male	False	
"BRERETON, Mr George Andrew"	1st Class Passenger	Southampton		26.55	37	Male	True	
"BREWE, Dr Arthur Jackson"	1st Class Passenger	Cherbourg		39.6	45	Male	False	
"BROWN, Mrs Caroline Lane"	1st Class Passenger	Southampton		51.47916667	59	Female	True	
"BROWN, Mrs Margaret"	1st Class Passenger	Cherbourg		27.72083333	44	Female	True	
"BUCKNELL, Mrs Emma Eliza"	1st Class Passenger	Cherbourg		76.29166667	58	Female	True	
"BURNS, Miss Elizabeth Margaret"	1st Class Passenger	Cherbourg	Nursemaid	134.5	41	Female	True	Servant
"BUTT, Major Archibald Willingham"	1st Class Passenger	Southampton	Military	26.55	46	Male	False	
"CAIRNS, Mr Alexander Milne"	1st Class Passenger	Southampton	Servant	31	28	Male	False	Servant
"CALDERHEAD, Mr Edward Pennington"	1st Class Passenger	Southampton		26.2875	42	Male	True	
"CANDEE, Mrs Helen Churchill"	1st Class Passenger	Cherbourg		27.44583333	52	Female	True	
"CARDEZA, Mrs Charlotte Wardle"	1st Class Passenger	Cherbourg		512.3291667	58	Female	True	
"CARDEZA, Mr Thomas Drake Martinez"	1st Class Passenger	Cherbourg	Gentleman	512.3291667	36	Male	True	
"CARLSSON, Mr Frans Olof"	1st Class Passenger	Southampton		5	33	Male	False	
"CARRAú-ESTEVES, Mr José Pedro"	1st Class Passenger	Southampton		47.1	17	Male	False	
"CARRAU, Mr Francisco Mauro Severiano"	1st Class Passenger	Southampton		47.1	27	Male	False	
"CARTER, Mr William Ernest"	1st Class Passenger	Southampton		120	36	Male	True	
"CARTER, Mrs Lucile"	1st Class Passenger	Southampton		120	36	Female	True	
"CARTER, Miss Lucile Polk"	1st Class Passenger	Southampton		120	13	Female	True	
"CARTER, Master William Thornton II"	1st Class Passenger	Southampton		120	11	Male	True	
"CASE, Mr Howard Brown"	1st Class Passenger	Southampton		26	49	Male	False	
"CASSEBEER, Mrs Eleanor Genevieve"	1st Class Passenger	Cherbourg		27.72083333	36	Female	True	
"CAVENDISH, Mr Tyrell William"	1st Class Passenger	Southampton		78.85	36	Male	False	
"CAVENDISH, Mrs Julia Florence"	1st Class Passenger	Southampton		78.85	25	Female	True	
"CHAFFEE, Mr Herbert Fuller"	1st Class Passenger	Southampton		61.175	46	Male	False	
"CHAFFEE, Mrs Carrie Constance"	1st Class Passenger	Southampton		61.175	47	Female	True	
"CHAMBERS, Mr Norman Campbell"	1st Class Passenger	Southampton		53.1	27	Male	True	
"CHAMBERS, Mrs Bertha"	1st Class Passenger	Southampton		53.1	32	Female	True	
"CHAUDANSON, Miss Victorine"	1st Class Passenger	Cherbourg	Personal Maid	262.375	36	Female	True	Servant
"CHERRY, Miss Gladys"	1st Class Passenger	Southampton	Of Independent Means	86.5	30	Female	True	
"CHEVRé, Mr Paul Romaine Marie Léonce"	1st Class Passenger	Cherbourg	Sculptor	29.7	45	Male	True	
"CHIBNALL, Mrs Edith Martha Bowerman"	1st Class Passenger	Southampton	Of Independent Means	55	48	Female	True	
"CHISHOLM, Mr Roderick Robert Crispin"	1st Class Passenger	Belfast	Draughtsman	0	43	Male	False	H&W Guarantee Group
"CLARK, Mr Walter Miller"	1st Class Passenger	Cherbourg		136.7791667	27	Male	False	
"CLARK, Mrs Virginia Estelle"	1st Class Passenger	Cherbourg		136.7791667	26	Female	True	
"CLEAVER, Miss Alice Catherine"	1st Class Passenger	Southampton	Nursemaid	151.8	22	Female	True	Servant
"CLIFFORD, Mr George Quincy"	1st Class Passenger	Southampton		52	40	Male	False	
"COLLEY, Mr Edward Pomeroy"	1st Class Passenger	Southampton		25.5875	37	Male	False	
"COMPTON, Mrs Mary Eliza"	1st Class Passenger	Cherbourg		83.15833333	64	Female	True	
"COMPTON, Miss Sara Rebecca"	1st Class Passenger	Cherbourg		83.15833333	39	Female	True	
"COMPTON, Mr Alexander Taylor jr"	1st Class Passenger	Cherbourg		83.15833333	37	Male	False	
"CORNELL, Mrs Malvina Helen"	1st Class Passenger	Southampton		25.74166667	55	Female	True	
"CRAFTON, Mr John Bertram"	1st Class Passenger	Southampton	Businessman	26.55	59	Male	False	
"CROSBY, Captain Edward Gifford"	1st Class Passenger	Southampton		71	70	Male	False	
"CROSBY, Mrs Catherine Elizabeth"	1st Class Passenger	Southampton		71	64	Female	True	
"CROSBY, Miss Harriette Rebecca"	1st Class Passenger	Southampton		26.55	39	Female	True	
"CUMINGS, Mr John Bradley"	1st Class Passenger	Cherbourg		71.28333333	39	Male	False	
"CUMINGS, Mrs Florence Briggs"	1st Class Passenger	Cherbourg		71.28333333	35	Female	True	
"DALY, Mr Peter Dennis"	1st Class Passenger	Southampton	Businessman	26.55	51	Male	True	
"DANIEL, Mr Robert Williams"	1st Class Passenger	Southampton		30.5	27	Male	True	
"DANIELS, Miss Sarah Rebecca"	1st Class Passenger	Southampton	Personal Maid	151.8	33	Female	True	Servant
"DAVIDSON, Mr Thornton"	1st Class Passenger	Cherbourg		52	31	Male	False	
"DAVIDSON, Mrs Orian"	1st Class Passenger	Cherbourg		52	27	Female	True	
"DICK, Mr Albert Adrian"	1st Class Passenger	Southampton		57	31	Male	True	
"DICK, Mrs Vera"	1st Class Passenger	Southampton		57	17	Female	True	
"DODGE, Dr Washington"	1st Class Passenger	Southampton	Politician	81.85833333	52	Male	True	
"DODGE, Mrs Ruth"	1st Class Passenger	Southampton		81.85833333	34	Female	True	
"DODGE, Master Washington"	1st Class Passenger	Southampton		81.85833333	4	Male	True	
"DOUGLAS, Mr Walter Donald"	1st Class Passenger	Cherbourg		106.425	50	Female	False	
"DOUGLAS, Mrs Mahala"	1st Class Passenger	Cherbourg		106.425	48	Female	True	
"DOUGLAS, Mrs Mary Hélène"	1st Class Passenger	Cherbourg		247.5208333	27	Female	True	
"DUFF GORDON, Sir Cosmo Edmund"	1st Class Passenger	Cherbourg	Landowner	39.6	49	Male	True	
"DUFF GORDON, Lucy Christiana, Lady"	1st Class Passenger	Cherbourg	Dressmaker / Couturi?re	56.92916667	48	Female	True	
"DULLES, Mr William Crothers"	1st Class Passenger	Cherbourg		29.7	39	Male	False	
"EARNSHAW, Mrs Olive"	1st Class Passenger	Cherbourg	Of Independent Means	83.15833333	23	Female	True	
"ENDRES, Miss Caroline Louise"	1st Class Passenger	Cherbourg	Nurse	247.525	39	Female	True	Servant
"EUSTIS, Miss Elizabeth Mussey"	1st Class Passenger	Cherbourg		78.26666667	54	Female	True	
"EVANS, Miss Edith Corse"	1st Class Passenger	Cherbourg		31.67916667	36	Female	False	
"FARTHING, Mr John"	1st Class Passenger	Southampton	Servant	221.7791667	57	Male	False	Servant
"FLEGENHEIM, Mrs Antoinette"	1st Class Passenger	Cherbourg		31.68333333	48	Female	True	
"FLEMING, Miss Margaret"	1st Class Passenger	Cherbourg	Personal Maid	110.8833333	42	Female	True	Servant
"FLYNN, Mr John Irwin"	1st Class Passenger	Southampton		26.2875	36	Male	True	
"FOREMAN, Mr Benjamin Laventall"	1st Class Passenger	Southampton		27.75	30	Male	False	
"FORTUNE, Mr Mark"	1st Class Passenger	Southampton		263	64	Male	False	
"FORTUNE, Mrs Mary"	1st Class Passenger	Southampton		263	60	Female	True	
"FORTUNE, Miss Ethel Flora"	1st Class Passenger	Southampton		263	28	Female	True	
"FORTUNE, Miss Alice Elizabeth"	1st Class Passenger	Southampton		263	24	Female	True	
"FORTUNE, Miss Mabel Helen"	1st Class Passenger	Southampton		263	23	Female	True	
"FORTUNE, Mr Charles Alexander"	1st Class Passenger	Southampton		263	19	Male	False	
"FRANCATELLI, Miss Laura Mabel"	1st Class Passenger	Cherbourg	Secretary	56.92916667	31	Female	True	Servant
"FRANKLIN, Mr Thomas Parnham"	1st Class Passenger	Southampton		26.55	37	Male	False	
"FRAUENTHAL, Mr Isaac Gerald"	1st Class Passenger	Cherbourg		27.72083333	43	Male	True	
"FRAUENTHAL, Dr Henry William"	1st Class Passenger	Southampton	Doctor	133.65	49	Male	True	
"FRAUENTHAL, Mrs Clara"	1st Class Passenger	Southampton		133.65	42	Female	True	
"FRöLICHER, Miss Hedwig Margaritha"	1st Class Passenger	Cherbourg		49.5	22	Female	True	
"FRöLICHER-STEHLI, Mr Maximilian Josef"	1st Class Passenger	Cherbourg		79.2	60	Male	True	
"FRöLICHER-STEHLI, Mrs Margaretha Emerentia"	1st Class Passenger	Cherbourg		79.2	48	Female	True	
"FRY, Mr Richard"	1st Class Passenger	Southampton	Servant	0	39	Male	False	Servant
"FUTRELLE, Mr Jacques Heath"	1st Class Passenger	Southampton	Writer	53.1	37	Male	False	
"FUTRELLE, Mrs Lily May"	1st Class Passenger	Southampton		53.1	35	Female	True	
"GEE, Mr Arthur H."	1st Class Passenger	Southampton		38.5	47	Male	False	
"GIBSON, Mrs Pauline Caroline"	1st Class Passenger	Cherbourg		59.4	44	Female	True	
"GIBSON, Miss Dorothy Winifred"	1st Class Passenger	Cherbourg		59.4	22	Female	True	
"GIEGER, Miss Amalie"	1st Class Passenger	Southampton	Personal Maid	211.5	35	Female	True	Servant
"GIGLIO, Mr Victor Gaitan Andrea"	1st Class Passenger	Cherbourg	Servant	79.2	23	Male	False	Servant
"GOLDENBERG, Mr Samuel L."	1st Class Passenger	Cherbourg		89.10416667	47	Male	True	
"GOLDENBERG, Mrs Nella"	1st Class Passenger	Cherbourg		89.10416667	40	Female	True	
"GOLDSCHMIDT, Mr George B."	1st Class Passenger	Cherbourg	Lawyer	34.65416667	71	Male	False	
"GRACIE, Colonel Archibald"	1st Class Passenger	Southampton	Writer	28.5	53	Male	True	
"GRAHAM, Mr George Edward"	1st Class Passenger	Southampton	Sales Manager	30	38	Male	False	
"GRAHAM, Mrs Edith"	1st Class Passenger	Southampton		153.4625	59	Female	True	
"GRAHAM, Miss Margaret Edith"	1st Class Passenger	Southampton		153.4625	19	Female	True	
"GREENFIELD, Mrs Blanche"	1st Class Passenger	Cherbourg		63.35833333	45	Female	True	
"GREENFIELD, Mr William Bertram"	1st Class Passenger	Cherbourg		63.35833333	23	Male	True	
"GUGGENHEIM, Mr Benjamin"	1st Class Passenger	Cherbourg	Businessman	79.2	46	Male	False	
"HARDER, Mr George Achilles"	1st Class Passenger	Cherbourg	Businessman	55.44166667	25	Male	True	
"HARDER, Mrs Dorothy"	1st Class Passenger	Cherbourg		55.44166667	21	Female	True	
"HARPER, Mr Henry Sleeper"	1st Class Passenger	Cherbourg	Of Independent Means	76.72916667	48	Male	True	
"HARPER, Mrs Myra Raymond"	1st Class Passenger	Cherbourg		76.72916667	49	Female	True	
"HARRINGTON, Mr Charles Henry"	1st Class Passenger	Southampton	Servant	42.4	37	Male	False	Servant
"HARRIS, Mr Henry Birkhardt"	1st Class Passenger	Southampton	Theatre Manager	83.475	45	Male	False	
"HARRIS, Mrs Irene"	1st Class Passenger	Southampton		83.475	35	Female	True	
"HARRISON, Mr William Henry"	1st Class Passenger	Southampton	Secretary	0	45	Male	False	Servant
"HASSAB, Mr Hammad"	1st Class Passenger	Cherbourg	Servant	76.72916667	27	Male	True	Servant
"HAWKSFORD, Mr Walter James"	1st Class Passenger	Southampton	Sales Manager	30	45	Male	True	
"HAYS, Mr Charles Melville"	1st Class Passenger	Southampton	Businessman	93.5	55	Male	False	
"HAYS, Mrs Clara Jennings"	1st Class Passenger	Southampton		93.5	52	Female	True	
"HAYS, Miss Margaret Bechstein"	1st Class Passenger	Cherbourg		83.15833333	24	Female	True	
"HEAD, Mr Christopher"	1st Class Passenger	Southampton	Politician	42.5	42	Male	False	
"HILLIARD, Mr Herbert Henry"	1st Class Passenger	Southampton	Buyer	51.8625	44	Male	False	
"HIPKINS, Mr William Edward"	1st Class Passenger	Southampton	Manufacturer	50	55	Male	False	
"HIPPACH, Mrs Ida Sophia"	1st Class Passenger	Cherbourg		57.97916667	44	Female	True	
"HIPPACH, Miss Jean Gertrude"	1st Class Passenger	Cherbourg		57.97916667	17	Female	True	
"HOGEBOOM, Mrs Anna Louisa"	1st Class Passenger	Cherbourg	Of Independent Means	77.95833333	51	Female	True	
"HOLVERSON, Mr Alexander Oskar"	1st Class Passenger	Southampton		52	42	Male	False	
"HOLVERSON, Mrs Mary Aline"	1st Class Passenger	Southampton		52	35	Female	True	
"HOMER, Mr Harry"	1st Class Passenger	Southampton	Gambler	26.55	40	Male	True	
"HOYT, Mr Frederick Maxfield"	1st Class Passenger	Southampton		100	38	Male	True	
"HOYT, Mrs Jane Anne"	1st Class Passenger	Southampton		100	31	Female	True	
"HOYT, Mr William Fisher"	1st Class Passenger	Cherbourg	Businessman	30.69583333	42	Male	False	
"ICARD, Miss Rose Amélie"	1st Class Passenger	Southampton	Personal Maid	80	39	Female	True	Servant
"ISHAM, Miss Ann Elizabeth"	1st Class Passenger	Cherbourg		28.7125	50	Female	False	
"ISMAY, Mr Joseph Bruce"	1st Class Passenger	Southampton	Shipowner	0	49	Male	True	
"JONES, Mr Charles Cresson"	1st Class Passenger	Southampton	Estate Manager	26	46	Male	False	
"JULIAN, Mr Henry Forbes"	1st Class Passenger	Southampton	Metallurgist	26	50	Male	False	
"KEEPING, Mr Edwin Herbert"	1st Class Passenger	Southampton	Servant	211.5	33	Male	False	Servant
"KENT, Mr Edward Austin"	1st Class Passenger	Cherbourg	Architect	29.7	58	Male	False	
"KENYON, Mr Frederick Roland"	1st Class Passenger	Southampton		51.8625	41	Male	False	
"KENYON, Mrs Marion Estelle"	1st Class Passenger	Southampton		51.8625	40	Female	True	
"KIMBALL, Mr Edwin Nelson Jr."	1st Class Passenger	Southampton		52.55416667	42	Male	True	
"KIMBALL, Mrs Susan Gertrude"	1st Class Passenger	Southampton		52.55416667	45	Female	True	
"KLABER, Mr Herman"	1st Class Passenger	Southampton	Businessman	26.55	42	Male	False	
"KREUCHEN, Miss Emilie"	1st Class Passenger	Southampton	Personal Maid	211.3375	29	Female	True	Servant
"LEADER, Dr Alice May"	1st Class Passenger	Southampton	Doctor	25.92916667	49	Male	True	
"LEROY, Miss Berthe"	1st Class Passenger	Cherbourg	Personal Maid	106.425	27	Female	True	Servant
"LESUEUR, Mr Gustave J."	1st Class Passenger	Cherbourg	Servant	512.3291667	35	Male	True	Servant
"LEWY, Mr Ervin G."	1st Class Passenger	Cherbourg	Jeweller	27.72083333	30	Male	False	
"LINDEBERG-LIND, Mr Erik Gustaf"	1st Class Passenger	Southampton	Businessman	26.55	42	Male	False	
"LINDSTRöM, Mrs Sigrid"	1st Class Passenger	Cherbourg		27.72083333	55	Female	True	
"LINES, Mrs Elizabeth Lindsey"	1st Class Passenger	Cherbourg		39.4	50	Female	True	
"LINES, Miss Mary Conover"	1st Class Passenger	Cherbourg		39.4	16	Female	True	
"LONG, Mr Milton Clyde"	1st Class Passenger	Southampton		30	29	Male	False	
"LONGLEY, Miss Gretchen Fiske"	1st Class Passenger	Cherbourg		77.95833333	21	Female	True	
"LORING, Mr Joseph Holland"	1st Class Passenger	Southampton	Stockbroker	45.5	30	Male	False	
"LURETTE, Miss Eugénie Elise"	1st Class Passenger	Cherbourg	Personal Maid	146.5208333	59	Female	True	Servant
"MADILL, Miss Georgette Alexandra"	1st Class Passenger	Southampton		211.3375	16	Female	True	
"MAGUIRE, Mr John Edward"	1st Class Passenger	Southampton		26	30	Male	False	
"MAIONI, Miss Roberta Elizabeth Mary"	1st Class Passenger	Southampton	Personal Maid	86.5	19	Female	True	Servant
"MARéCHAL, Mr Pierre"	1st Class Passenger	Cherbourg	Aviator	29.7	29	Male	True	
"MARVIN, Mr Daniel Warner"	1st Class Passenger	Southampton	Of Independent Means	53.1	18	Male	False	
"MARVIN, Mrs Mary Graham Carmichael"	1st Class Passenger	Southampton		53.1	18	Female	True	
"MAYNé, Mlle Berthe Antonine"	1st Class Passenger	Cherbourg	Singer	49.50416667	24	Female	True	
"MCCAFFRY, Mr Thomas Francis"	1st Class Passenger	Southampton	Banker	75.24166667	46	Male	False	
"MCCARTHY, Mr Timothy J."	1st Class Passenger	Southampton	Buyer	51.8625	54	Male	False	
"MCGOUGH, Mr James Robert"	1st Class Passenger	Southampton	Buyer	26.2875	35	Male	True	
"MEYER, Mr Edgar Joseph"	1st Class Passenger	Cherbourg	Mechanical Engineer	82.17083333	28	Male	False	
"MEYER, Mrs Leila"	1st Class Passenger	Cherbourg		82.17083333	25	Female	True	
"MILLET, Mr Francis Davis"	1st Class Passenger	Cherbourg	Artist	26.55	65	Male	False	
"MINAHAN, Dr William Edward"	1st Class Passenger	Queenstown	Merchant	90	44	Male	False	
"MINAHAN, Mrs Lillian E."	1st Class Passenger	Queenstown		90	37	Female	True	
"MINAHAN, Miss Daisy E."	1st Class Passenger	Queenstown		90	33	Female	True	
"MOCK, Mr Philipp Edmund"	1st Class Passenger	Cherbourg		57.75	30	Male	True	
"MOLSON, Mr Harry Markland"	1st Class Passenger	Southampton	Businessman	30.5	55	Male	False	
"MOORE, Mr Clarence Bloomfield"	1st Class Passenger	Southampton	Businessman	42.4	47	Male	False	
"NATSCH, Mr Charles"	1st Class Passenger	Cherbourg		29.7	36	Male	False	
"NEWELL, Mr Arthur Webster"	1st Class Passenger	Cherbourg		113.275	58	Male	False	
"NEWELL, Miss Marjorie Anne"	1st Class Passenger	Cherbourg		113.275	23	Female	True	
"NEWELL, Miss Madeleine"	1st Class Passenger	Cherbourg		113.275	31	Female	True	
"NEWSOM, Miss Helen Monypeny"	1st Class Passenger	Southampton		26.28333333	19	Female	True	
"NICHOLSON, Mr Arthur Ernest"	1st Class Passenger	Southampton		26	59	Male	False	
"NOURNEY, Mr Alfred"	1st Class Passenger	Cherbourg	Gentleman	13.8625	20	Male	True	
"OLIVA Y OCANA, Doña Fermina"	1st Class Passenger	Cherbourg	Personal Maid	108.9	39	Male	True	Servant
"OMONT, Mr Alfred Fernand"	1st Class Passenger	Cherbourg	Dealer	25.74166667	29	Male	True	
"OSTBY, Mr Engelhart Cornelius"	1st Class Passenger	Southampton	Jeweller	61.97916667	64	Male	False	
"OVIéS Y RODRíGUEZ, Mr Servando José Florentino"	1st Class Passenger	Cherbourg	Merchant	27.72083333	36	Male	False	
"PARR, Mr William Henry Marsh"	1st Class Passenger	Belfast	Electrician	0	29	Male	False	H&W Guarantee Group
"PARTNER, Mr Austin"	1st Class Passenger	Southampton	Stockbroker	28.5	40	Male	False	
"PAYNE, Mr Vivian Ponsonby"	1st Class Passenger	Southampton	Clerk	93.5	22	Male	False	Servant
"PEARS, Mr Thomas Clinton"	1st Class Passenger	Southampton	Of Independent Means	66.6	29	Male	False	
"PEARS, Mrs Edith"	1st Class Passenger	Southampton		66.6	22	Female	True	
"PEñASCO Y CASTELLANA, Mr Victor"	1st Class Passenger	Cherbourg	Of Independent Means	108.9	24	Male	False	
"PEñASCO Y CASTELLANA, Mrs Maria Josefa Perezde Soto y Vallejo"	1st Class Passenger	Cherbourg	Of Independent Means	108.9	22	Female	True	
"PERREAULT, Miss Mary Anne"	1st Class Passenger	Southampton	Personal Maid	93.5	33	Female	True	Servant
"PEUCHEN, Major Arthur Godfrey"	1st Class Passenger	Southampton		30.5	52	Male	True	
"PORTER, Mr Walter Chamberlain"	1st Class Passenger	Southampton		52	46	Male	False	
"POTTER, Mrs Lily Alexenia"	1st Class Passenger	Cherbourg		83.15833333	56	Female	True	
"REUCHLIN, Mr Jonkheer Johan George"	1st Class Passenger	Cherbourg		0	38	Male	False	
"RHEIMS, Mr George Alexander Lucien"	1st Class Passenger	Cherbourg	Businessman	39.6	33	Male	True	
"RIGHINI, Mr Sante"	1st Class Passenger	Cherbourg	Servant	135.6333333	22	Male	False	Servant
"ROBERT, Mrs Elisabeth Walton"	1st Class Passenger	Southampton	Of Independent Means	211.3375	43	Female	True	
"ROBINS, Mr Victor"	1st Class Passenger	Cherbourg	Servant	247.525	42	Male	False	Servant
"ROEBLING, Mr Washington Augustus II"	1st Class Passenger	Southampton	Of Independent Means	50.49583333	31	Male	False	
"ROMAINE, Mr Charles Hallace"	1st Class Passenger	Southampton		26.55	45	Male	True	
"ROOD, Mr Hugh Roscoe"	1st Class Passenger	Southampton	Businessman	50	39	Male	False	
"ROSENBAUM, Miss Edith Louise"	1st Class Passenger	Cherbourg	Journalist	27.72083333	33	Female	True	
"ROSENSHINE, Mr George"	1st Class Passenger	Cherbourg	Merchant	79.2	46	Male	False	
"ROSS, Mr John Hugo"	1st Class Passenger	Southampton		40.125	36	Male	False	
"ROTHES, Lucy Noël Martha, Countess of"	1st Class Passenger	Southampton	Of Independent Means	86.5	33	Female	True	
"ROTHSCHILD, Mr Martin"	1st Class Passenger	Cherbourg		59.4	46	Male	False	
"ROTHSCHILD, Mrs Elizabeth Jane Anne"	1st Class Passenger	Cherbourg		59.4	54	Female	True	
"ROWE, Mr Alfred G."	1st Class Passenger	Southampton	Landowner	26.55	59	Male	False	
"RYERSON, Mr Arthur Larned"	1st Class Passenger	Cherbourg		262.375	61	Male	False	
"RYERSON, Mrs Emily Maria"	1st Class Passenger	Cherbourg		262.375	48	Female	True	
"RYERSON, Miss Emily Borie"	1st Class Passenger	Cherbourg		262.375	18	Female	True	
"RYERSON, Miss Susan Parker ""Suzette"""	1st Class Passenger	Cherbourg		262.375	21	Female	True	
"RYERSON, Master John Borie"	1st Class Passenger	Cherbourg		262.375	13	Male	True	
"SAALFELD, Mr Adolphe"	1st Class Passenger	Southampton	Businessman	30.5	47	Male	True	
"SALOMON, Mr Abraham Lincoln"	1st Class Passenger	Cherbourg	Businessman	26	43	Male	True	
"SäGESSER, Mlle Emma"	1st Class Passenger	Cherbourg	Personal Maid	69.3	24	Female	True	Servant
"SCHABERT, Mrs Emma"	1st Class Passenger	Cherbourg		57.75	35	Female	True	
"SERREPLAN, Miss Auguste"	1st Class Passenger	Southampton	Personal Maid	31	30	Female	True	Servant
"SEWARD, Mr Frederic Kimber"	1st Class Passenger	Southampton	Lawyer	26.55	34	Male	True	
"SHUTES, Miss Elizabeth Weed"	1st Class Passenger	Southampton	Governess	153.4625	40	Female	True	Servant
"SILVERTHORNE, Mr Spencer Victor"	1st Class Passenger	Southampton		26.2875	35	Male	True	
"SILVEY, Mr William Baird"	1st Class Passenger	Cherbourg	Businessman	55.9	51	Male	False	
"SILVEY, Mrs Alice Gray"	1st Class Passenger	Cherbourg		55.9	39	Female	True	
"SIMONIUS-BLUMER, Mr Colonel (Oberst) Alfons"	1st Class Passenger	Southampton	Banker	35.5	56	Male	True	
"SLOPER, Mr William Thompson"	1st Class Passenger	Southampton	Stockbroker	35.5	28	Male	True	
"SMART, Mr John Montgomery"	1st Class Passenger	Southampton		26.55	56	Male	False	
"SMITH, Mr James Clinch"	1st Class Passenger	Cherbourg	Military	30.69583333	56	Male	False	
"SMITH, Mr Richard William"	1st Class Passenger	Southampton		26	57	Male	False	
"SMITH, Mr Lucian Philip"	1st Class Passenger	Cherbourg		60	24	Male	False	
"SMITH, Mrs Mary Eloise"	1st Class Passenger	Cherbourg		60	18	Female	True	
"SNYDER, Mr John Pillsbury"	1st Class Passenger	Southampton		82.26666667	24	Male	True	
"SNYDER, Mrs Nelle"	1st Class Passenger	Southampton		82.26666667	23	Female	True	
"SPEDDEN, Mr Frederic Oakley"	1st Class Passenger	Cherbourg		134.5	45	Male	True	
"SPEDDEN, Mrs Margaretta Corning"	1st Class Passenger	Cherbourg		134.5	39	Female	True	
"SPEDDEN, Master Robert Douglas"	1st Class Passenger	Cherbourg		134.5	6	Male	True	
"SPENCER, Mr William Augustus"	1st Class Passenger	Cherbourg		146.5208333	57	Male	False	
"SPENCER, Mrs Marie Eugenie"	1st Class Passenger	Cherbourg		146.5208333	45	Female	True	
"STäHELIN-MAEGLIN, Dr Max"	1st Class Passenger	Southampton	Lawyer	30.5	32	Male	True	
"STEAD, Mr William Thomas"	1st Class Passenger	Southampton	Journalist	26.55	62	Male	False	
"STENGEL, Mr Charles Emil Henry"	1st Class Passenger	Cherbourg	Businessman	55.44166667	54	Male	True	
"STENGEL, Mrs Annie May"	1st Class Passenger	Cherbourg		55.44166667	44	Female	True	
"STEPHENSON, Mrs Martha"	1st Class Passenger	Cherbourg		78.26666667	52	Female	True	
"STEWART, Mr Albert Ankeny"	1st Class Passenger	Cherbourg	Businessman	27.72083333	64	Male	False	
"STONE, Mrs Martha Evelyn"	1st Class Passenger	Southampton		80	62	Female	True	
"STRAUS, Mr Isidor"	1st Class Passenger	Southampton	Businessman	221.7791667	67	Male	False	
"STRAUS, Mrs Rosalie Ida"	1st Class Passenger	Southampton		221.7791667	63	Female	False	
"SUTTON, Mr Frederick"	1st Class Passenger	Southampton	Property Developer / Real Estate	32.32083333	61	Male	False	
"SWIFT, Mrs Margaret Welles"	1st Class Passenger	Southampton		25.92916667	46	Female	True	
"TAUSSIG, Mr Emil"	1st Class Passenger	Southampton		79.65	52	Male	False	
"TAUSSIG, Mrs Tillie"	1st Class Passenger	Southampton		79.65	39	Female	True	
"TAUSSIG, Miss Ruth"	1st Class Passenger	Southampton		79.65	18	Female	True	
"TAYLOR, Mr Elmer Zebley"	1st Class Passenger	Southampton	Manufacturer	52	48	Male	True	
"TAYLOR, Mrs Juliet Cummins"	1st Class Passenger	Southampton		52	49	Female	True	
"THAYER, Mr John Borland"	1st Class Passenger	Cherbourg	Businessman	110.8833333	49	Male	False	
"THAYER, Mrs Marian Longstreth"	1st Class Passenger	Cherbourg		110.8833333	39	Female	True	
"THAYER, Mr John Borland jr"	1st Class Passenger	Cherbourg	Scholar	110.8833333	17	Male	True	
"THORNE, Miss Gertrude Maybelle"	1st Class Passenger	Cherbourg		80.2	38	Female	True	
"TUCKER, Mr Gilbert Milligan jr"	1st Class Passenger	Cherbourg		28.5375	31	Male	True	
"URUCHURTU, Don. Manuel Ramirez"	1st Class Passenger	Cherbourg	Lawyer	27.72083333	39	Male	False	
"VAN DER HOEF, Mr Wyckoff"	1st Class Passenger	Belfast	Businessman	33.5	61	Male	False	
"WALKER, Mr William Anderson"	1st Class Passenger	Southampton		34.25	48	Male	False	
"WARD, Miss Annie Moore"	1st Class Passenger	Cherbourg	Personal Maid	512.3291667	35	Female	True	Servant
"WARREN, Mr Frank Manley"	1st Class Passenger	Cherbourg		75.25	63	Male	False	
"WARREN, Mrs Anna Sophia"	1st Class Passenger	Cherbourg		75.25	60	Female	True	
"WEIR, Colonel John"	1st Class Passenger	Southampton	Military	26.55	59	Male	False	
"WHITE, Mr Percival Wayland"	1st Class Passenger	Southampton	Manufacturer	77.2875	54	Male	False	
"WHITE, Mr Richard Frasar"	1st Class Passenger	Southampton		77.2875	21	Male	False	
"WHITE, Mrs Ella"	1st Class Passenger	Cherbourg		135.6333333	55	Female	True	
"WICK, Col. George Dennick"	1st Class Passenger	Southampton		164.8666667	57	Male	False	
"WICK, Mrs Mary Peebles"	1st Class Passenger	Southampton		164.8666667	45	Female	True	
"WICK, Miss Mary Natalie"	1st Class Passenger	Southampton		164.8666667	31	Female	True	
"WIDENER, Mr George Dunton"	1st Class Passenger	Southampton	Banker	211.5	50	Male	False	
"WIDENER, Mrs Eleanor"	1st Class Passenger	Southampton		211.5	50	Female	True	
"WIDENER, Mr Harry Elkins"	1st Class Passenger	Southampton	Bibliophile	211.5	27	Male	False	
"WILLARD, Miss Constance"	1st Class Passenger	Southampton		26.55	21	Female	True	
"WILLIAMS, Mr Fletcher Fellowes Lambert"	1st Class Passenger	Southampton	Businessman	35	43	Male	False	
"WILLIAMS, Mr Charles Duane"	1st Class Passenger	Cherbourg	Lawyer	61.37916667	51	Male	False	
"WILLIAMS, Mr Richard Norris II"	1st Class Passenger	Cherbourg	Sportsman	61.37916667	21	Male	True	
"WILSON, Miss Helen Alice"	1st Class Passenger	Cherbourg	Personal Maid	134.5	31	Female	True	Servant
"WOOLNER, Mr Hugh"	1st Class Passenger	Southampton	Businessman	35.5	45	Male	True	
"WRIGHT, Mr George"	1st Class Passenger	Southampton	Businessman	26.55	62	Male	False	
"YOUNG, Miss Marie Grice"	1st Class Passenger	Cherbourg		135.6333333	36	Female	True	
"ABELSON, Mr Samuel"	2nd Class Passenger	Cherbourg		24	30	Male	False	
"ABELSON, Mrs Hannah"	2nd Class Passenger	Cherbourg		24	28	Female	True	
"ALDWORTH, Mr Augustus Henry"	2nd Class Passenger	Southampton	Chauffeur	13	34	Male	False	Servant
"ANDREW, Mr Edgar Samuel"	2nd Class Passenger	Southampton		11.5	17	Male	False	
"ANDREW, Mr Frank Thomas"	2nd Class Passenger	Southampton	Miner	10.5	25	Male	False	
"ANGLE, Mr William"	2nd Class Passenger	Southampton	Tile Maker	26	32	Male	False	
"ANGLE, Mrs Florence Agnes"	2nd Class Passenger	Southampton		26	36	Female	True	
"ASHBY, Mr John"	2nd Class Passenger	Southampton		13	57	Male	False	
"BAILEY, Mr Percy"	2nd Class Passenger	Southampton	Butcher's Assistant	11.5	15	Male	False	
"BAINBRIGGE, Mr Charles Robert"	2nd Class Passenger	Southampton	Horse Trainer	10.5	22	Male	False	
"BALLS, Mrs Ada E."	2nd Class Passenger	Southampton		13	36	Female	True	
"BANFIELD, Mr Frederick James"	2nd Class Passenger	Southampton	Miner	10.5	28	Male	False	
"BATEMAN, Revd Robert James"	2nd Class Passenger	Southampton	Priest / Minister	12.525	51	Male	False	
"BEANE, Mr Edward"	2nd Class Passenger	Southampton		26	32	Male	True	
"BEANE, Mrs Ethel"	2nd Class Passenger	Southampton		26	22	Female	True	
"BEAUCHAMP, Mr Henry James"	2nd Class Passenger	Southampton	Club Head Steward	26	28	Male	False	
"BECKER, Mrs Nellie E."	2nd Class Passenger	Southampton		39	35	Female	True	
"BECKER, Miss Marion Louise"	2nd Class Passenger	Southampton		39	4	Female	True	
"BECKER, Master Richard F."	2nd Class Passenger	Southampton		39	1	Male	True	
"BECKER, Miss Ruth Elizabeth"	2nd Class Passenger	Southampton		39	12	Female	True	
"BEESLEY, Mr Lawrence"	2nd Class Passenger	Southampton	Teacher	13	34	Male	True	
"BENTHAM, Miss Lillian W."	2nd Class Passenger	Southampton		13	19	Female	True	
"BERRIMAN, Mr William John"	2nd Class Passenger	Southampton		13	23	Male	False	
"BOTSFORD, Mr William Hull"	2nd Class Passenger	Southampton		13	25	Male	False	
"BOWENUR, Mr Solomon"	2nd Class Passenger	Southampton	Merchant	13	42	Male	False	
"BRACKEN, Mr James Hollen"	2nd Class Passenger	Southampton	Stockman	13	29	Male	False	
"BRAILEY, Mr William Theodore Ronald"	2nd Class Passenger	Southampton	Musician	0	24	Male	False	Musician
"BRICOUX, Mr Roger Marie"	2nd Class Passenger	Southampton	Musician	0	20	Male	False	Musician
"BRITO, Mr José Joaquim de"	2nd Class Passenger	Southampton		13	32	Male	False	
"BROWN, Miss Amelia Mary"	2nd Class Passenger	Southampton	Cook (Personal)	13	18	Female	True	Servant
"BROWN, Mr Thomas William Solomon"	2nd Class Passenger	Southampton	Hotelier	39	60	Male	False	
"BROWN, Mrs Elizabeth Catherine"	2nd Class Passenger	Southampton		39	40	Female	True	
"BROWN, Miss Edith Eileen"	2nd Class Passenger	Southampton	Scholar	39	15	Female	True	
"BRYHL, Mr Kurt Arnold Gottfrid"	2nd Class Passenger	Southampton		26	25	Male	False	
"BRYHL, Miss Dagmar Jenny Ingeborg"	2nd Class Passenger	Southampton		26	20	Female	True	
"BUSS, Miss Kate"	2nd Class Passenger	Southampton		13	36	Female	True	
"BUTLER, Mr Reginald Fenton"	2nd Class Passenger	Southampton	Mechanical Engineer	13	25	Male	False	
"BYLES, Fr Thomas Roussel Davids"	2nd Class Passenger	Southampton	Priest / Minister	13	42	Male	False	
"BYSTRöM, Mrs Karolina"	2nd Class Passenger	Southampton		13	40	Female	True	
"CALDWELL, Mr Albert Francis"	2nd Class Passenger	Southampton		29	26	Male	True	
"CALDWELL, Mrs Sylvia Mae"	2nd Class Passenger	Southampton		29	28	Female	True	
"CALDWELL, Master Alden Gates"	2nd Class Passenger	Southampton		29	0.833333333	Male	True	
"CAMERON, Miss Clear Annie"	2nd Class Passenger	Southampton	Personal Maid	21	35	Female	True	
"CAMPBELL, Mr William Henry"	2nd Class Passenger	Belfast		0	21	Male	False	H&W Guarantee Group
"CARBINES, Mr William"	2nd Class Passenger	Southampton	Miner	13	19	Male	False	
"CARTER, Fr Ernest Courtenay"	2nd Class Passenger	Southampton	Priest / Minister	26	54	Male	False	
"CARTER, Mrs Lilian"	2nd Class Passenger	Southampton		26	45	Female	False	
"CHAPMAN, Mr Charles Henry"	2nd Class Passenger	Southampton		13.5	52	Male	False	
"CHAPMAN, Mr John Henry"	2nd Class Passenger	Southampton	Farmer	26	36	Male	False	
"CHAPMAN, Mrs Sara Elizabeth"	2nd Class Passenger	Southampton		26	28	Female	False	
"CHRISTY, Mrs Alice Frances"	2nd Class Passenger	Southampton		30	45	Female	True	
"CHRISTY, Miss Rachel Juli Cohen"	2nd Class Passenger	Southampton		30	25	Female	True	
"CLARKE, Mr Charles Valentine"	2nd Class Passenger	Southampton	Dairy Worker	26	29	Male	False	
"CLARKE, Mrs Ada Maria"	2nd Class Passenger	Southampton		27	28	Female	True	
"CLARKE, Mr John Frederick Preston"	2nd Class Passenger	Southampton	Musician	0	28	Male	False	Musician
"COLERIDGE, Mr Reginald Charles"	2nd Class Passenger	Southampton	Advertising Consultant	10.5	29	Male	False	
"COLLANDER, Mr Erik Gustaf"	2nd Class Passenger	Southampton		13	27	Male	False	
"COLLETT, Mr Sidney Clarence Stuart"	2nd Class Passenger	Southampton		10.5	25	Male	True	
"COLLYER, Mr Harvey"	2nd Class Passenger	Southampton	Grocer	26.25	31	Male	False	
"COLLYER, Mrs Charlotte Caroline"	2nd Class Passenger	Southampton		26.25	31	Female	True	
"COLLYER, Miss Marjorie Lottie"	2nd Class Passenger	Southampton		26.25	8	Female	True	
"COOK, Mrs Selena"	2nd Class Passenger	Southampton		10.5	22	Female	True	
"CORBETT, Mrs Irene"	2nd Class Passenger	Southampton	Musician	13	30	Female	False	
"COREY, Mrs Mary Emma"	2nd Class Passenger	Southampton		21	30	Female	False	
"COTTERILL, Mr Henry"	2nd Class Passenger	Southampton	Carpenter / Joiner	11.5	20	Male	False	
"CUNNINGHAM, Mr Alfred Fleming"	2nd Class Passenger	Belfast	Fitter	0	21	Male	False	H&W Guarantee Group
"DAVIES, Mr Charles Henry"	2nd Class Passenger	Southampton		73.5	19	Male	False	
"DAVIES, Mrs Agnes"	2nd Class Passenger	Southampton		36.75	48	Female	True	
"DAVIES, Master John Morgan jr"	2nd Class Passenger	Southampton		36.75	8	Male	True	
"DAVIS, Miss Mary Ann Charlotte"	2nd Class Passenger	Southampton		13	28	Female	True	
"DEACON, Mr Percy William"	2nd Class Passenger	Southampton	Baker	73.5	18	Male	False	
"DEL CARLO, Mr Sebastiano"	2nd Class Passenger	Cherbourg		27.72083333	29	Male	False	
"DEL CARLO, Mrs Argene"	2nd Class Passenger	Cherbourg		27.72083333	24	Female	True	
"DENBUOY, Mr Albert Joseph"	2nd Class Passenger	Southampton	Fruit Farmer	31.5	25	Male	False	
"DIBDEN, Mr William"	2nd Class Passenger	Southampton	General Labourer	73.5	18	Male	False	
"DOLING, Mrs Ada Julia Elizabeth"	2nd Class Passenger	Southampton		23	34	Female	True	
"DOLING, Miss Elsie"	2nd Class Passenger	Southampton		23	18	Female	True	
"DOUTON, Mr William Joseph"	2nd Class Passenger	Southampton	Quarryman	26	55	Male	False	
"DREW, Mr James Vivian"	2nd Class Passenger	Southampton		32.5	42	Male	False	
"DREW, Mrs Lulu Thorne"	2nd Class Passenger	Southampton		32.5	34	Female	True	
"DREW, Master Marshall Brines"	2nd Class Passenger	Southampton		32.5	8	Male	True	
"DURáN I MONé, Sra. Florentina"	2nd Class Passenger	Cherbourg		13.85833333	30	Female	True	
"DURáN I MONé, Sra. Asuncion"	2nd Class Passenger	Cherbourg		13.85833333	27	Female	True	
"EITEMILLER, Mr George Floyd"	2nd Class Passenger	Southampton		13	25	Male	False	
"ENANDER, Mr Ingvar"	2nd Class Passenger	Southampton		13	21	Male	False	
"FAHLSTRøM, Mr Arne Joma"	2nd Class Passenger	Southampton		13	18	Male	False	
"FAUNTHORPE, Mr Harry Bartram"	2nd Class Passenger	Southampton		26	41	Male	False	
"FILLBROOK, Mr Joseph Charles"	2nd Class Passenger	Southampton	Painter & Decorator	10.5	18	Male	False	
"FOX, Mr Stanley Harrington"	2nd Class Passenger	Southampton	Businessman	13	38	Male	False	
"FROST, Mr Anthony Wood"	2nd Class Passenger	Belfast	Fitter	0	38	Male	False	H&W Guarantee Group
"FUNK, Miss Annie Clemmer"	2nd Class Passenger	Southampton	Missionary	13	38	Female	False	
"FYNNEY, Mr Joseph J."	2nd Class Passenger	Southampton	Rubber Merchant	26	35	Male	False	
"GALE, Mr Harry"	2nd Class Passenger	Southampton	Miner	21	38	Male	False	
"GALE, Mr Shadrach"	2nd Class Passenger	Southampton	Miner	21	33	Male	False	
"GARSIDE, Miss Ethel"	2nd Class Passenger	Southampton		13	39	Female	True	
"GASKELL, Mr William Alfred"	2nd Class Passenger	Southampton	Cooper	26	19	Male	False	
"GAVEY, Mr Laurence"	2nd Class Passenger	Southampton		10.5	26	Male	False	
"GILBERT, Mr William"	2nd Class Passenger	Southampton		10.5	47	Male	False	
"GILES, Mr Edgar"	2nd Class Passenger	Southampton	Cab Driver	11.5	21	Male	False	
"GILES, Mr Frederick Edward"	2nd Class Passenger	Southampton	Bus Driver	11.5	20	Male	False	
"GILES, Mr Ralph"	2nd Class Passenger	Southampton		13.5	24	Male	False	
"GILL, Mr John"	2nd Class Passenger	Southampton	Chauffeur	13	24	Male	False	
"GILLESPIE, Mr William Henry"	2nd Class Passenger	Southampton	Clerk	13	31	Male	False	
"GIVARD, Mr Hans Kristensen"	2nd Class Passenger	Southampton		13	30	Male	False	
"GREENBERG, Mr Samuel"	2nd Class Passenger	Southampton		13	52	Male	False	
"HALE, Mr Reginald"	2nd Class Passenger	Southampton	Gardener	13	30	Male	False	
"HARBECK, Mr William H."	2nd Class Passenger	Southampton	Cinematographer	13	44	Male	False	
"HARPER, Rev. John"	2nd Class Passenger	Southampton	Priest / Minister	33	39	Male	False	
"HARPER, Miss Annie Jessie"	2nd Class Passenger	Southampton		33	6	Female	True	
"HARRIS, Mr George"	2nd Class Passenger	Southampton		10.5	62	Male	True	
"HARRIS, Mr Walter"	2nd Class Passenger	Southampton		10.5	44	Male	False	
"HART, Mr Benjamin"	2nd Class Passenger	Southampton	Builder	26.25	47	Male	False	
"HART, Mrs Esther Ada"	2nd Class Passenger	Southampton		26.25	48	Female	True	
"HART, Miss Eva Miriam"	2nd Class Passenger	Southampton		26.25	7	Female	True	
"HARTLEY, Mr Wallace Henry"	2nd Class Passenger	Southampton	Musician	0	33	Male	False	Musician
"HäMäLäINEN, Mrs Anna"	2nd Class Passenger	Southampton		14.5	23	Female	True	
"HäMäLäINEN, Master Viljo Unto Johannes"	2nd Class Passenger	Southampton		14.5	0.583333333	Male	True	
"HERMAN, Mr Samuel"	2nd Class Passenger	Southampton	Farmer	65	49	Male	False	
"HERMAN, Mrs Jane"	2nd Class Passenger	Southampton		65	48	Female	True	
"HERMAN, Miss Alice"	2nd Class Passenger	Southampton		65	23	Female	True	
"HERMAN, Miss Kate"	2nd Class Passenger	Southampton		65	23	Female	True	
"HEWLETT, Mrs Mary Dunbar"	2nd Class Passenger	Southampton		16	56	Female	True	
"HICKMAN, Mr Leonard Mark"	2nd Class Passenger	Southampton		73.5	24	Male	False	
"HICKMAN, Mr Lewis"	2nd Class Passenger	Southampton		73.5	30	Male	False	
"HICKMAN, Mr Stanley George"	2nd Class Passenger	Southampton		73.5	20	Male	False	
"HILTUNEN, Miss Marta"	2nd Class Passenger	Southampton		13	18	Female	False	
"HOCKING, Mr Richard George"	2nd Class Passenger	Southampton	Baker	11.5	23	Male	False	
"HOCKING, Mrs Eliza"	2nd Class Passenger	Southampton		23	54	Female	True	
"HOCKING, Miss Ellen"	2nd Class Passenger	Southampton		23	20	Female	True	
"HOCKING, Mr Samuel James Metcalfe"	2nd Class Passenger	Southampton	Painter & Decorator	13	36	Male	False	
"HODGES, Mr Henry Price"	2nd Class Passenger	Southampton	Musical Instrument Vendor	13	50	Male	False	
"HOLD, Mr Stephen"	2nd Class Passenger	Southampton	Clerk	26	44	Male	False	
"HOLD, Mrs Annie Margaret"	2nd Class Passenger	Southampton		26	29	Female	True	
"HOOD, Mr Ambrose Jr"	2nd Class Passenger	Southampton		73.5	21	Male	False	
"HOSONO, Mr Masabumi"	2nd Class Passenger	Southampton	Civil Servant	13	41	Male	True	
"HOWARD, Mr Benjamin"	2nd Class Passenger	Southampton	Retired	26	63	Male	False	
"HOWARD, Mrs Ellen Truelove"	2nd Class Passenger	Southampton		26	61	Female	False	
"HUME, Mr John Law"	2nd Class Passenger	Southampton	Musician	0	21	Male	False	Musician
"HUNT, Mr George Henry"	2nd Class Passenger	Southampton	Gardener	12.275	33	Male	False	
"ILETT, Miss Bertha"	2nd Class Passenger	Southampton		10.5	17	Female	True	
"JACOBSOHN, Mr Sidney Samuel"	2nd Class Passenger	Southampton	Lawyer	27	42	Male	False	
"JACOBSOHN, Mrs Amy Frances Christy"	2nd Class Passenger	Southampton		27	24	Female	True	
"JARVIS, Mr Denzil John"	2nd Class Passenger	Southampton	Engineer	15	47	Male	False	
"JEFFERYS, Mr Clifford Thomas"	2nd Class Passenger	Southampton	Granite Cutter	31.5	24	Male	False	
"JEFFERYS, Mr Ernest Wilfred"	2nd Class Passenger	Southampton	Granite Cutter	31.5	22	Male	False	
"JENKIN, Mr Stephen Curnow"	2nd Class Passenger	Southampton	Miner	10.5	32	Male	False	
"JERWAN, Mrs Marie Marthe"	2nd Class Passenger	Cherbourg		13.79166667	23	Female	True	
"KANTOR, Mr Sinai"	2nd Class Passenger	Southampton		26	34	Male	False	
"KANTOR, Mrs Miriam"	2nd Class Passenger	Southampton		26	24	Female	True	
"KARNES, Mrs Claire"	2nd Class Passenger	Southampton		21	28	Female	False	
"KEANE, Mr Daniel"	2nd Class Passenger	Queenstown		12.35	35	Male	False	
"KEANE, Miss Nora Agnes"	2nd Class Passenger	Queenstown		12.35	46	Female	True	
"KELLY, Mrs Fanny Maria"	2nd Class Passenger	Southampton		13.5	45	Female	True	
"KIRKLAND, Fr Charles Leonard"	2nd Class Passenger	Queenstown	Priest / Minister	12.35	52	Male	False	
"KNIGHT, Mr Robert"	2nd Class Passenger	Belfast	Fitter	0	39	Male	False	H&W Guarantee Group
"KRINS, Mr Georges Alexandre"	2nd Class Passenger	Southampton	Musician	0	23	Male	False	Musician
"KVILLNER, Mr Johan Henrik Johannesson"	2nd Class Passenger	Southampton	Mechanical Engineer	10.5	31	Male	False	
"LAHTINEN, Fr William"	2nd Class Passenger	Southampton	Priest / Minister	26	35	Male	False	
"LAHTINEN, Mrs Anna Amelia"	2nd Class Passenger	Southampton		26	34	Female	False	
"LAMB, Mr John J."	2nd Class Passenger	Queenstown	Gentleman	10.70833333	30	Male	False	
"LAROCHE, Mr Joseph Philippe Lemercier"	2nd Class Passenger	Cherbourg	Engineer	41.57916667	25	Male	False	
"LAROCHE, Mrs Juliette Marie Louise"	2nd Class Passenger	Cherbourg		41.57916667	22	Female	True	
"LAROCHE, Miss Louise"	2nd Class Passenger	Cherbourg		41.57916667	1	Female	True	
"LAROCHE, Miss Simonne Marie Anne Andrée"	2nd Class Passenger	Cherbourg		41.57916667	3	Female	True	
"LéVY, Mr René Jacques"	2nd Class Passenger	Southampton	Chemist	12.875	36	Male	False	
"LEHMANN, Miss Bertha"	2nd Class Passenger	Cherbourg		12	17	Female	True	
"LEITCH, Miss Jessie Wills"	2nd Class Passenger	Southampton		33	31	Female	True	
"LEMORE, Mrs Amelia"	2nd Class Passenger	Southampton		10.5	46	Female	True	
"LEYSON, Mr Robert William Norman"	2nd Class Passenger	Southampton	Solicitor	10.5	25	Male	False	
"LINNANE, Mr John"	2nd Class Passenger	Queenstown	Gentleman	12.35	61	Male	False	
"LOUCH, Mr Charles"	2nd Class Passenger	Southampton	Saddler	26	50	Male	False	
"LOUCH, Mrs Alice Adelaide"	2nd Class Passenger	Southampton		26	42	Female	True	
"MACK, Mrs Mary"	2nd Class Passenger	Southampton		10.5	57	Female	False	
"MALACHARD, Mr Jean-Noël"	2nd Class Passenger	Cherbourg		15.55	25	Male	False	
"MALLET, Mr Albert Denis Pierre"	2nd Class Passenger	Cherbourg	Merchant	37.05	45	Male	False	
"MALLET, Mrs Antonine Marie"	2nd Class Passenger	Cherbourg		37.05	24	Female	True	
"MALLET, Master André Clement"	2nd Class Passenger	Cherbourg		37.05	1	Male	True	
"MANGIAVACCHI, Mr Serafino Emilio"	2nd Class Passenger	Cherbourg	Clerk	15.57916667	30	Male	False	
"MATTHEWS, Mr William John"	2nd Class Passenger	Southampton	China Clay Worker	13	23	Male	False	
"MAYBERY, Mr Frank Hubert"	2nd Class Passenger	Southampton	Property Developer / Real Estate	16	36	Male	False	
"MCCRAE, Mr Arthur Gordon"	2nd Class Passenger	Southampton	Engineer	13.5	32	Male	False	
"MCCRIE, Mr James Matthew"	2nd Class Passenger	Southampton	Oil Worker	13	32	Male	False	
"MCKANE, Mr Peter Dan"	2nd Class Passenger	Southampton	Quarryman	26	46	Male	False	
"MELLINGER, Mrs Elizabeth Anne"	2nd Class Passenger	Southampton	Servant	19.5	41	Female	True	
"MELLINGER, Miss Violet Madeline"	2nd Class Passenger	Southampton		19.5	13	Female	True	
"MELLORS, Mr William John"	2nd Class Passenger	Southampton	Salesman	10.5	19	Male	True	
"MEYER, Mr August"	2nd Class Passenger	Southampton	Baker	13	31	Male	False	
"MILLING, Mr Jacob Christian"	2nd Class Passenger	Southampton	Machine Inspector	13	48	Male	False	
"MITCHELL, Mr Henry Michael"	2nd Class Passenger	Southampton	Retired	10.5	71	Male	False	
"MONTVILA, Fr Juozas"	2nd Class Passenger	Southampton	Priest / Minister	13	27	Male	False	
"MORAWECK, Dr Ernest"	2nd Class Passenger	Southampton	Doctor	14	54	Male	False	
"MORLEY, Mr Henry Samuel"	2nd Class Passenger	Southampton	Confectioner	26	38	Male	False	
"MUDD, Mr Thomas Cupper"	2nd Class Passenger	Southampton		10.5	16	Male	False	
"MYLES, Mr Thomas Francis"	2nd Class Passenger	Queenstown	Gentleman	9.6875	63	Male	False	
"NASSER, Mr Nicholas"	2nd Class Passenger	Cherbourg		30.07083333	28	Male	False	
"NASSER, Mrs Adele"	2nd Class Passenger	Cherbourg		30.07083333	14	Female	True	
"NAVRATIL, Mr Michel"	2nd Class Passenger	Southampton		26	32	Male	False	
"NAVRATIL, Master Edmond Roger"	2nd Class Passenger	Southampton		26	2	Male	True	
"NAVRATIL, Master Michel Marcel"	2nd Class Passenger	Southampton		26	3	Male	True	
"NESSON, Mr Israel"	2nd Class Passenger	Southampton	Electrician	13	26	Male	False	
"NICHOLLS, Mr Joseph Charles"	2nd Class Passenger	Southampton	Miner	36.75	19	Male	False	
"NORMAN, Mr Robert Douglas"	2nd Class Passenger	Southampton	Electrical Engineer	13.5	27	Male	False	
"NYE, Mrs Elizabeth"	2nd Class Passenger	Southampton		10.5	29	Female	True	
"OTTER, Mr Richard"	2nd Class Passenger	Southampton	Stone Cutter	13	38	Male	False	
"OXENHAM, Mr Percy Thomas"	2nd Class Passenger	Southampton	Mason	10.5	22	Male	True	
"PADRON MANENT, Mr Julian"	2nd Class Passenger	Cherbourg	Chauffeur	13.8625	26	Male	True	
"PAIN, Dr Alfred"	2nd Class Passenger	Southampton	Doctor	10.5	23	Male	False	
"PALLàS I CASTELLó, Sr. Emili"	2nd Class Passenger	Cherbourg		13.85833333	29	Male	True	
"PARKER, Mr Clifford Richard"	2nd Class Passenger	Southampton	Clerk	10.5	17	Male	False	
"PARKES, Mr Francis"	2nd Class Passenger	Belfast	Plumber	0	21	Male	False	H&W Guarantee Group
"PARRISH, Mrs Lutie Davis"	2nd Class Passenger	Southampton		26	59	Female	True	
"PENGELLY, Mr Frederick William"	2nd Class Passenger	Southampton	Miner	10.5	19	Male	False	
"PERNOT, Mr René"	2nd Class Passenger	Cherbourg	Chauffeur	15.05	39	Male	False	Servant
"PERUSCHITZ, Fr Josef"	2nd Class Passenger	Southampton	Priest / Minister	13	41	Male	False	
"PHILLIPS, Mr Escott Robert"	2nd Class Passenger	Southampton		21	42	Male	False	
"PHILLIPS, Miss Alice Frances Louisa"	2nd Class Passenger	Southampton		21	21	Female	True	
"PHILLIPS, Miss Kate Florence"	2nd Class Passenger	Southampton		26	19	Female	True	
"PINSKY, Mrs Rosa"	2nd Class Passenger	Southampton		13	32	Female	True	
"PONESELL, Mr Martin"	2nd Class Passenger	Southampton		13	24	Male	False	
"PORTALUPPI, Mr Emilio Ilario Giuseppe"	2nd Class Passenger	Cherbourg		12.7375	30	Male	True	
"PULBAUM, Mr Franz"	2nd Class Passenger	Cherbourg		15.4	27	Male	False	
"QUICK, Mrs Jane"	2nd Class Passenger	Southampton		26	33	Female	True	
"QUICK, Miss Winifred Vera"	2nd Class Passenger	Southampton		26	8	Female	True	
"QUICK, Miss Phyllis May"	2nd Class Passenger	Southampton		26	2	Female	True	
"REEVES, Mr David"	2nd Class Passenger	Southampton	Carpenter / Joiner	10.5	36	Male	False	
"RENOUF, Mr Peter Henry"	2nd Class Passenger	Southampton	Carpenter / Joiner	21	33	Male	False	
"RENOUF, Mrs Lillian"	2nd Class Passenger	Southampton		21	30	Female	True	
"REYNALDS, Sra. Encarnación"	2nd Class Passenger	Southampton		13	28	Female	True	
"RICHARD, Mr Emile Phillippe"	2nd Class Passenger	Cherbourg		15.55	23	Male	False	
"RICHARDS, Mrs Emily"	2nd Class Passenger	Southampton		18.75	24	Female	True	
"RICHARDS, Master William Rowe"	2nd Class Passenger	Southampton		18.75	3	Male	True	
"RICHARDS, Master Sibley George"	2nd Class Passenger	Southampton		18.75	0.75	Male	True	
"RIDSDALE, Miss Lucy"	2nd Class Passenger	Southampton		10.5	58	Female	True	
"ROGERS, Mr Reginald Harry"	2nd Class Passenger	Southampton		10.5	18	Male	False	
"RUGG, Miss Emily"	2nd Class Passenger	Southampton		10.5	21	Female	True	
"SCHMIDT, Mr Augustus"	2nd Class Passenger	Southampton		13	21	Male	False	
"SEDGWICK, Mr Charles Frederick Waddington"	2nd Class Passenger	Southampton		13	28	Male	False	
"SHARP, Mr Percival"	2nd Class Passenger	Southampton		26	27	Male	False	
"SHELLEY, Mrs Imanita Parrish"	2nd Class Passenger	Southampton		26	25	Female	True	
"SILVéN, Miss Lyyli Karoliina"	2nd Class Passenger	Southampton		13	17	Female	True	
"SINCOCK, Miss Maude"	2nd Class Passenger	Southampton		36.75	20	Female	True	
"SINKKONEN, Miss Anna"	2nd Class Passenger	Southampton		13	29	Female	True	
"SJöSTEDT, Mr Ernst Adolf"	2nd Class Passenger	Southampton		13.5	59	Male	False	
"SLAYTER, Miss Hilda Mary"	2nd Class Passenger	Queenstown		12.35	30	Female	True	
"SLEMEN, Mr Richard James"	2nd Class Passenger	Southampton	Journeyman carpenter	10.5	35	Male	False	
"SMITH, Miss Marion Elsie"	2nd Class Passenger	Southampton		13	39	Female	True	
"SOBEY, Mr Samuel James Hayden"	2nd Class Passenger	Southampton	Quarryman	13	25	Male	False	
"STANTON, Mr Samuel Ward"	2nd Class Passenger	Cherbourg		15.55	42	Male	False	
"STOKES, Mr Philip Joseph"	2nd Class Passenger	Southampton	Bricklayer	10.5	25	Male	False	
"SWANE, Mr George"	2nd Class Passenger	Southampton	Chauffeur	13	19	Male	False	Servant
"SWEET, Mr George Frederick"	2nd Class Passenger	Southampton	Farm Labourer	65	14	Male	False	
"TAYLOR, Mr Percy Cornelius"	2nd Class Passenger	Southampton	Musician	0	32	Male	False	Musician
"TOOMEY, Miss Ellen Mary"	2nd Class Passenger	Southampton	Servant	10.5	48	Female	True	
"TROUPIANSKY, Mr Moses Aaron"	2nd Class Passenger	Southampton	Shop Assistant	13	23	Male	False	
"TROUT, Mrs Jessie Laird"	2nd Class Passenger	Southampton		12.65	27	Female	True	
"TROUTT, Miss Edwina Celia"	2nd Class Passenger	Southampton		10.5	27	Female	True	
"TURPIN, Mr William John"	2nd Class Passenger	Southampton	Carpenter / Joiner	21	29	Male	False	
"TURPIN, Mrs Dorothy Ann"	2nd Class Passenger	Southampton	Housewife	21	26	Female	False	
"VEAL, Mr James"	2nd Class Passenger	Southampton		13	40	Male	False	
"WALLCROFT, Miss Ellen 'Nellie'"	2nd Class Passenger	Southampton	Cook	21	36	Female	True	
"WARE, Mr John James"	2nd Class Passenger	Southampton	Carpenter / Joiner	21	45	Male	False	
"WARE, Mrs Florence Louise"	2nd Class Passenger	Southampton		21	31	Female	True	
"WARE, Mr William Jeffery"	2nd Class Passenger	Southampton		10.5	23	Male	False	
"WATSON, Mr Ennis Hastings"	2nd Class Passenger	Belfast	Apprentice Electrician	0	19	Male	False	H&W Guarantee Group
"WATT, Mrs Elizabeth"	2nd Class Passenger	Southampton		15.75	40	Female	True	
"WATT, Miss Robertha Josephine"	2nd Class Passenger	Southampton		15.75	12	Female	True	
"WEBBER, Miss Susan"	2nd Class Passenger	Southampton		13	37	Female	True	
"WEISZ, Mr Léopold"	2nd Class Passenger	Southampton	Stonemason and Carver	26	37	Male	False	
"WEISZ, Mrs Mathilde Françoise"	2nd Class Passenger	Southampton		26	37	Female	True	
"WELLS, Mrs"	2nd Class Passenger	Southampton		23	29	Female	True	
"WELLS, Miss Joan"	2nd Class Passenger	Southampton		23	4	Female	True	
"WELLS, Master Ralph Lester"	2nd Class Passenger	Southampton		23	2	Male	True	
"WEST, Mr Edwy Arthur"	2nd Class Passenger	Southampton		27.75	36	Male	False	
"WEST, Mrs Ada Mary"	2nd Class Passenger	Southampton		27.75	33	Female	True	
"WEST, Miss Constance Mirium"	2nd Class Passenger	Southampton		27.75	4	Female	True	
"WEST, Miss Barbara Joyce"	2nd Class Passenger	Southampton		27.75	0.833333333	Female	True	
"WHEADON, Mr Edward Henry"	2nd Class Passenger	Southampton	Farmer	10.5	65	Male	False	
"WHEELER, Mr Edwin Charles"	2nd Class Passenger	Southampton	Servant	12.875	24	Male	False	Servant
"WHILEMS, Mr Charles"	2nd Class Passenger	Southampton	Factory Foreman	13	31	Male	True	
"WILKINSON, Mrs Elizabeth Anne"	2nd Class Passenger	Southampton		26	35	Female	True	
"WILLIAMS, Mr Charles Eugene"	2nd Class Passenger	Southampton	Sportsman	13	23	Male	True	
"WOODWARD, Mr John Wesley"	2nd Class Passenger	Southampton	Musician	0	32	Male	False	Musician
"WRIGHT, Miss Marion"	2nd Class Passenger	Southampton		13.5	26	Female	True	
"YVOIS, Miss Henriette"	2nd Class Passenger	Southampton		13	24	Female	False	
"ABBING, Mr Anthony"	3rd Class Passenger	Southampton	Blacksmith	7.55	42	Male	False	
"ABBOTT, Mrs Rhoda Mary 'Rosa'"	3rd Class Passenger	Southampton		20.25	39	Female	True	
"ABBOTT, Mr Rossmore Edward"	3rd Class Passenger	Southampton	Jeweller	20.25	16	Male	False	
"ABBOTT, Mr Eugene Joseph"	3rd Class Passenger	Southampton	Scholar	20.25	14	Male	False	
"ABELSETH, Miss Karen Marie"	3rd Class Passenger	Southampton		7.65	16	Female	True	
"ABELSETH, Mr Olaus Jørgensen"	3rd Class Passenger	Southampton	Farmer	7.65	25	Male	True	
"ABRAHAMSSON, Mr Abraham August Johannes"	3rd Class Passenger	Southampton		7.925	20	Male	True	
"ADAMS, Mr John"	3rd Class Passenger	Southampton		8.05	26	Male	False	
"AHLIN, Mrs Johanna Persdotter"	3rd Class Passenger	Southampton		9.475	40	Female	False	
"AKS, Mrs Leah"	3rd Class Passenger	Southampton		9.35	18	Female	True	
"AKS, Master Frank Philip"	3rd Class Passenger	Southampton		9.35	0.833333333	Male	True	
"ALBIMONA, Mr Nassef Cassem"	3rd Class Passenger	Cherbourg		18.7875	26	Male	True	
"ALEXANDER, Mr William Albert"	3rd Class Passenger	Southampton	General Labourer	7.8875	23	Male	False	
"ALHOMäKI, Mr Ilmari Rudolf"	3rd Class Passenger	Southampton	General Labourer	7.925	19	Male	False	
"ALI, Mr Ahmed"	3rd Class Passenger	Southampton	General Labourer	7.05	24	Male	False	
"ALI, Mr William"	3rd Class Passenger	Southampton	General Labourer	7.05	25	Male	False	
"ALLEN, Mr William Henry"	3rd Class Passenger	Southampton	Tool Maker	8.05	38	Male	False	
"ALLUM, Mr Owen George"	3rd Class Passenger	Southampton	Gardener	8.3	15	Male	False	
"ANDERSEN, Mr Albert Karvin"	3rd Class Passenger	Southampton	Engineer	22.525	33	Male	False	
"ANDERSEN-JENSEN, Miss Carla Christine Nielsine"	3rd Class Passenger	Southampton		7.854166667	19	Female	True	
"ANDERSSON, Miss Erna Alexandra"	3rd Class Passenger	Southampton		7.925	17	Female	True	
"ANDERSSON, Mr Johan Samuel"	3rd Class Passenger	Southampton	General Labourer	7.775	26	Male	False	
"ANDERSSON, Miss Ida Augusta Margareta"	3rd Class Passenger	Southampton		7.775	38	Female	False	
"ANDERSSON, Mr Anders Johan"	3rd Class Passenger	Southampton	General Labourer	31.275	39	Male	False	
"ANDERSSON, Mrs Alfrida Konstantia Brogren"	3rd Class Passenger	Southampton		31.275	39	Female	False	
"ANDERSSON, Miss Sigrid Elisabeth"	3rd Class Passenger	Southampton		31.275	11	Female	False	
"ANDERSSON, Miss Ingeborg Constanzia"	3rd Class Passenger	Southampton		31.275	9	Female	False	
"ANDERSSON, Miss Ebba Iris Alfrida"	3rd Class Passenger	Southampton		31.275	6	Female	False	
"ANDERSSON, Master Sigvard Harald Elias"	3rd Class Passenger	Southampton		31.275	4	Male	False	
"ANDERSSON, Miss Ellis Anna Maria"	3rd Class Passenger	Southampton		31.275	2	Female	False	
"ANDREASSON, Mr Pål Edvin"	3rd Class Passenger	Southampton	General Labourer	7.854166667	20	Male	False	
"ANGHELOFF, Mr Minko"	3rd Class Passenger	Southampton	General Labourer	7.895833333	26	Male	False	
"ARNOLD-FRANCHI, Mr Josef"	3rd Class Passenger	Southampton	General Labourer	17.8	25	Male	False	
"ARNOLD-FRANCHI, Mrs Josefine"	3rd Class Passenger	Southampton		17.8	18	Female	False	
"ARONSSON, Mr Ernst Axel Algot"	3rd Class Passenger	Southampton	General Labourer	7.775	24	Male	False	
"ASIM, Mr Adola"	3rd Class Passenger	Southampton	General Labourer	7.05	35	Male	False	
"ASPLUND, Master Edvin Rojj Felix"	3rd Class Passenger	Southampton		31.3875	3	Male	True	
"ASPLUND, Mr Johan Charles"	3rd Class Passenger	Southampton		7.795833333	23	Male	True	
"ASPLUND, Mr Carl Oscar Vilhelm Gustafsson"	3rd Class Passenger	Southampton	General Labourer	31.3875	40	Male	False	
"ASPLUND, Mrs Selma Augusta Emilia"	3rd Class Passenger	Southampton		31.3875	38	Female	True	
"ASPLUND, Master Carl Edgar"	3rd Class Passenger	Southampton		31.3875	5	Male	False	
"ASPLUND, Master Filip Oscar"	3rd Class Passenger	Southampton		31.3875	13	Male	False	
"ASPLUND, Master Clarence Gustaf Hugo"	3rd Class Passenger	Southampton		31.3875	9	Male	False	
"ASPLUND, Miss Lillian Gertrud"	3rd Class Passenger	Southampton		31.3875	5	Female	True	
"ASSAF, Mrs Mariana"	3rd Class Passenger	Cherbourg		7.225	45	Female	True	
"ASSAM, Mr Ali"	3rd Class Passenger	Southampton	General Labourer	7.05	23	Male	False	
"ATTALA, Mr Sleiman"	3rd Class Passenger	Cherbourg	Journalist	7.225	27	Male	False	
"ATTALAH, Miss Malake"	3rd Class Passenger	Cherbourg		14.45833333	17	Female	False	
"AUGUSTSSON, Mr Albert"	3rd Class Passenger	Southampton	General Labourer	7.854166667	23	Male	False	
"AYOUB DAHER, Miss Banoura"	3rd Class Passenger	Cherbourg		7.229166667	15	Female	True	
"ÖDAHL, Mr Nils Martin"	3rd Class Passenger	Southampton	General Labourer	9.225	23	Male	False	
"ÖHMAN, Miss Velin"	3rd Class Passenger	Southampton		7.775	22	Female	True	
"ÅDAHL, Mr Mauritz"	3rd Class Passenger	Southampton	General Labourer	7.25	30	Male	False	
"BACCOS, Mr Raffull"	3rd Class Passenger	Cherbourg	Farm Labourer	7.225	20	Male	False	
"BACKSTRöM, Mr Karl Alfred"	3rd Class Passenger	Southampton	General Labourer	15.85	32	Male	False	
"BACKSTRöM, Mrs Maria Mathilda"	3rd Class Passenger	Southampton		15.85	33	Female	True	
"BACLINI, Mrs Latifa"	3rd Class Passenger	Cherbourg		19.25833333	24	Female	True	
"BACLINI, Miss Marie Catherine"	3rd Class Passenger	Cherbourg		19.25833333	5	Female	True	
"BACLINI, Miss Eugenie"	3rd Class Passenger	Cherbourg		19.25833333	3	Female	True	
"BACLINI, Miss Helene Barbara"	3rd Class Passenger	Cherbourg		19.25833333	0.75	Female	True	
"BADMAN, Miss Emily Louisa"	3rd Class Passenger	Southampton	Servant	8.05	18	Female	True	
"BADT, Mr Mohamed"	3rd Class Passenger	Cherbourg	Farmer	7.225	40	Male	False	
"BALKIC, Mr Cerin"	3rd Class Passenger	Southampton	General Labourer	7.895833333	26	Male	False	
"BANSKI, Mrs Mara"	3rd Class Passenger	Southampton		8.683333333	31	Female	True	
"BARBARA, Mrs Catherine David"	3rd Class Passenger	Cherbourg	Housekeeper	14.45416667	45	Female	False	
"BARBARA, Miss Saiide"	3rd Class Passenger	Cherbourg	Housekeeper	14.45416667	18	Female	False	
"BARRY, Miss Julia"	3rd Class Passenger	Queenstown	Housekeeper	7.879166667	26	Female	False	
"BARTON, Mr David John"	3rd Class Passenger	Southampton	General Labourer	8.05	22	Male	False	
"BATOSHEV, Mr Hristo Lalev"	3rd Class Passenger	Southampton	General Labourer	7.895833333	23	Male	False	
"BEAVAN, Mr William Thomas"	3rd Class Passenger	Southampton	General Labourer	8.05	20	Male	False	
"BENGTSSON, Mr Johan Viktor"	3rd Class Passenger	Southampton	General Labourer	7.775	26	Male	False	
"BERGLUND, Mr Karl Ivar Sven"	3rd Class Passenger	Southampton	General Labourer	9.35	22	Male	False	
"BING, Mr Lee"	3rd Class Passenger	Southampton	Seaman	56.49583333	32	Male	True	
"BIRKELAND, Mr Hans Martin Monsen"	3rd Class Passenger	Southampton	Seaman	7.775	21	Male	False	
"BJöRKLUND, Mr Ernst Herbert"	3rd Class Passenger	Southampton	General Labourer	7.75	18	Male	False	
"BOSTANDYEFF, Mr Guentcho"	3rd Class Passenger	Southampton	General Labourer	7.895833333	26	Male	False	
"BOULOS, Mrs Sultana"	3rd Class Passenger	Cherbourg		15.24583333	40	Female	False	
"BOULOS, Miss Nourelain"	3rd Class Passenger	Cherbourg		15.24583333	7	Female	False	
"BOULOS, Master Akar"	3rd Class Passenger	Cherbourg		15.24583333	9	Male	False	
"BOURKE, Mr John"	3rd Class Passenger	Queenstown	Farmer	15.5	42	Male	False	
"BOURKE, Mrs Catherine"	3rd Class Passenger	Queenstown	Housewife	15.5	32	Female	False	
"BOURKE, Miss Mary"	3rd Class Passenger	Queenstown		7.75	40	Female	False	
"BOWEN, Mr David John 'Dai'"	3rd Class Passenger	Southampton	Pugilist	16.1	26	Male	False	
"BRADLEY, Miss Bridget Delia"	3rd Class Passenger	Queenstown		7.725	22	Female	True	
"BRAF, Miss Elin Ester Maria"	3rd Class Passenger	Southampton	Servant	7.854166667	20	Female	False	
"BRAUND, Mr Lewis Richard"	3rd Class Passenger	Southampton	Farm Labourer	7.55	29	Male	False	
"BRAUND, Mr Owen Harris"	3rd Class Passenger	Southampton	Ironmonger	7.25	22	Male	False	
"BROBäCK, Mr Karl Rudolf"	3rd Class Passenger	Southampton	Decorator	7.795833333	22	Male	False	
"BROCKLEBANK, Mr William Alfred"	3rd Class Passenger	Southampton	Groom	8.05	35	Male	False	
"BUCKLEY, Mr Daniel"	3rd Class Passenger	Queenstown	Farm Labourer	7.820833333	21	Male	True	
"BUCKLEY, Miss Katherine"	3rd Class Passenger	Queenstown		7.283333333	22	Female	False	
"BURKE, Mr Jeremiah"	3rd Class Passenger	Queenstown	Farm Labourer	6.75	19	Male	False	
"BURNS, Miss Mary Delia"	3rd Class Passenger	Queenstown		7.879166667	17	Female	False	
"BUTRUS-KA'W?, Mr Tann?s"	3rd Class Passenger	Cherbourg	Shoemaker	7.229166667	21	Male	False	
"CACIC, Mr Jego Grga"	3rd Class Passenger	Southampton	Farmer	8.6625	18	Male	False	
"CACIC, Mr Luka"	3rd Class Passenger	Southampton	Farmer	8.6625	38	Male	False	
"CACIC, Miss Marija"	3rd Class Passenger	Southampton	Farm Labourer	8.6625	30	Female	False	
"CACIC, Miss Manda"	3rd Class Passenger	Southampton	Farm Labourer	8.6625	21	Female	False	
"CALIC, Mr Petar"	3rd Class Passenger	Southampton	Farm Labourer	8.6625	17	Male	False	
"CALIC, Mr Jovo"	3rd Class Passenger	Southampton		8.6625	17	Male	False	
"CANAVAN, Miss Mary"	3rd Class Passenger	Queenstown		7.75	22	Female	False	
"CANAVAN, Mr Patrick"	3rd Class Passenger	Queenstown	General Labourer	7.75	21	Male	False	
"CANN, Mr Ernest"	3rd Class Passenger	Southampton	Miner	8.05	21	Male	False	
"CARAM, Mr Joseph"	3rd Class Passenger	Cherbourg	Merchant	14.45833333	28	Male	False	
"CARAM, Mrs Maria Elias"	3rd Class Passenger	Cherbourg	Housekeeper	14.45833333	18	Female	False	
"CARLSSON, Mr Carl Robert"	3rd Class Passenger	Southampton	General Labourer	7.854166667	24	Male	False	
"CARLSSON, Mr August Sigfrid"	3rd Class Passenger	Southampton	Farmer	7.795833333	28	Male	False	
"CARR, Miss Jane"	3rd Class Passenger	Queenstown		7.75	45	Female	False	
"CARVER, Mr Alfred John"	3rd Class Passenger	Southampton	Seaman	7.25	28	Male	False	
"CELOTTI, Mr Francesco"	3rd Class Passenger	Southampton	Stoker	8.05	24	Male	False	
"CHARTERS, Mr David"	3rd Class Passenger	Queenstown	General Labourer	7.733333333	20	Male	False	
"CHIP, Mr Chang"	3rd Class Passenger	Southampton	Seaman	56.49583333	32	Male	True	
"CHRISTMANN, Mr Emil"	3rd Class Passenger	Southampton	Clerk	8.05	29	Male	False	
"CHRONOPOULOS, Mr Apostolos M."	3rd Class Passenger	Cherbourg	General Labourer	14.45416667	26	Male	False	
"CHRONOPOULOS, Mr Dimitrios M."	3rd Class Passenger	Cherbourg	General Labourer	14.45416667	21	Male	False	
"COELHO, Mr Domingos Fernandeo"	3rd Class Passenger	Southampton	General Labourer	7.05	20	Male	False	
"COHEN, Mr Gurshon"	3rd Class Passenger	Southampton	Printer / Compositor	8.05	18	Male	True	
"COLBERT, Mr Patrick"	3rd Class Passenger	Queenstown	General Labourer	7.25	24	Male	False	
"COLEFF, Mr Satio"	3rd Class Passenger	Southampton	General Labourer	7.895833333	24	Male	False	
"COLTCHEFF, Mr Peju"	3rd Class Passenger	Southampton	General Labourer	7.895833333	36	Male	False	
"CONLIN, Mr Thomas Henry"	3rd Class Passenger	Queenstown	General Labourer	7.733333333	31	Male	False	
"CONNAUGHTON, Mr Michael"	3rd Class Passenger	Queenstown	Bus Driver	7.75	40	Male	False	
"CONNOLLY, Miss Catherine"	3rd Class Passenger	Queenstown		7.75	23	Female	True	
"CONNOLLY, Miss Kate"	3rd Class Passenger	Queenstown		7.629166667	41	Female	False	
"CONNORS, Mr Patrick"	3rd Class Passenger	Queenstown	Farm Labourer	7.75	66	Male	False	
"COOK, Mr Jacob"	3rd Class Passenger	Southampton	Wood Carver	8.05	43	Male	False	
"COR, Mr Bartol"	3rd Class Passenger	Southampton	General Labourer	7.895833333	35	Male	False	
"COR, Mr Ivan"	3rd Class Passenger	Southampton	General Labourer	7.895833333	27	Male	False	
"COR, Mr Liudevit"	3rd Class Passenger	Southampton	General Labourer	7.895833333	19	Male	False	
"CORN, Mr Harry"	3rd Class Passenger	Southampton	Upholsterer	8.05	30	Male	False	
"CORR, Miss Helen"	3rd Class Passenger	Queenstown		7.75	16	Female	True	
"COUTTS, Mrs Winnie"	3rd Class Passenger	Southampton		15.9	36	Female	True	
"COUTTS, Master William Loch"	3rd Class Passenger	Southampton		15.9	9	Male	True	
"COUTTS, Master Neville Leslie"	3rd Class Passenger	Southampton		15.9	3	Male	True	
"COXON, Mr Daniel"	3rd Class Passenger	Southampton	Dealer	7.25	59	Male	False	
"CREASE, Mr Ernest James"	3rd Class Passenger	Southampton	Tinsmith	8.158333333	19	Male	False	
"CRIBB, Mr John Hatfield"	3rd Class Passenger	Southampton	Butler	16.1	44	Male	False	
"CRIBB, Miss Laura Mae"	3rd Class Passenger	Southampton	Shop Assistant	16.1	16	Female	True	
"CULUMOVIC, Mr Jeso"	3rd Class Passenger	Southampton		8.6625	17	Male	False	
"DAHER, Mr Tannous"	3rd Class Passenger	Cherbourg		7.229166667	28	Male	False	
"DAHL, Mr Charles Edward"	3rd Class Passenger	Southampton	Carpenter / Joiner	8.05	45	Male	True	
"DAHLBERG, Miss Gerda Ulrika"	3rd Class Passenger	Southampton		10.51666667	22	Female	False	
"DAKIC, Mr Branko"	3rd Class Passenger	Southampton	General Labourer	10.17083333	19	Male	False	
"DALY, Miss Margaret Marcella"	3rd Class Passenger	Queenstown	Housekeeper	6.95	33	Female	True	
"DALY, Mr Eugene Patrick"	3rd Class Passenger	Queenstown	Farm Labourer	7.75	29	Male	True	
"DANBOM, Mr Ernst Gilbert"	3rd Class Passenger	Southampton	General Labourer	14.4	34	Male	False	
"DANBOM, Mrs Anna Sigrid Maria"	3rd Class Passenger	Southampton		14.4	28	Female	False	
"DANBOM, Master Gilbert Sigvard Emanuel"	3rd Class Passenger	Southampton		14.4	0.333333333	Male	False	
"DANOFF, Mr Yoto"	3rd Class Passenger	Southampton	General Labourer	7.895833333	27	Male	False	
"DAVIES, Mr Evan"	3rd Class Passenger	Southampton	Miner	8.05	22	Male	False	
"DAVIES, Mr Alfred James"	3rd Class Passenger	Southampton	Caster	24.15	24	Male	False	
"DAVIES, Mr John"	3rd Class Passenger	Southampton	Ironworker	24.15	21	Male	False	
"DAVIES, Mr Joseph"	3rd Class Passenger	Southampton	Ironworker	8.05	17	Male	False	
"DAVISON, Mr Thomas Henry"	3rd Class Passenger	Southampton	Blacksmith	16.1	32	Male	False	
"DAVISON, Mrs Mary Elizabeth"	3rd Class Passenger	Southampton		16.1	34	Female	True	
"DE MESSEMAEKER, Mr Guillaume Joseph"	3rd Class Passenger	Southampton		17.4	36	Male	True	
"DE MESSEMAEKER, Mrs Anna"	3rd Class Passenger	Southampton		17.4	36	Female	True	
"DE MULDER, Mr Theodoor"	3rd Class Passenger	Southampton		9.5	30	Male	True	
"DE PELSMAEKER, Mr Alfons"	3rd Class Passenger	Southampton	Farm Labourer	9.5	16	Male	False	
"DEAN, Mr Bertram Frank"	3rd Class Passenger	Southampton	Farmer	20.575	25	Male	False	
"DEAN, Mrs Eva Georgetta"	3rd Class Passenger	Southampton		20.575	32	Female	True	
"DEAN, Master Bertram Vere"	3rd Class Passenger	Southampton		20.575	1	Male	True	
"DEAN, Miss Elizabeth Gladys 'Millvina'"	3rd Class Passenger	Southampton		20.575	0.166666667	Female	True	
"DELALIC, Mr Redjo"	3rd Class Passenger	Southampton	General Labourer	7.895833333	25	Male	False	
"DENKOFF, Mr Mitto"	3rd Class Passenger	Southampton	General Labourer	7.895833333	30	Male	False	
"DENNIS, Mr Samuel"	3rd Class Passenger	Southampton	Farmer	7.25	22	Male	False	
"DENNIS, Mr William"	3rd Class Passenger	Southampton	Farmer	7.25	26	Male	False	
"DEVANEY, Miss Margaret Delia"	3rd Class Passenger	Queenstown		7.879166667	19	Female	True	
"DIKA, Mr Mirko"	3rd Class Passenger	Southampton		7.895833333	17	Male	False	
"DIMIC, Mr Jovan"	3rd Class Passenger	Southampton		8.6625	42	Male	False	
"DINTCHEFF, Mr Valtcho"	3rd Class Passenger	Southampton		7.895833333	43	Male	False	
"DONOHOE, Miss Bridget"	3rd Class Passenger	Queenstown		7.75	21	Female	False	
"DOOLY, Mr Patrick"	3rd Class Passenger	Queenstown	General Labourer	7.75	38	Male	False	
"DORKING, Mr Edward Arthur"	3rd Class Passenger	Southampton	Groom	8.05	18	Male	True	
"DOUGHERTY, Mr William John"	3rd Class Passenger	Queenstown		8.458333333	22	Male	False	
"DOWDELL, Miss Elizabeth"	3rd Class Passenger	Southampton	Housekeeper	12.475	31	Female	True	
"DOYLE, Miss Elizabeth"	3rd Class Passenger	Queenstown		7.75	28	Female	False	
"DRAZENOVIC, Mr Jozef"	3rd Class Passenger	Cherbourg	General Labourer	7.895833333	33	Male	False	
"DRISCOLL, Miss Bridget"	3rd Class Passenger	Queenstown		7.75	27	Female	True	
"DROPKIN, Miss Jennie"	3rd Class Passenger	Southampton	Box Maker	8.05	24	Female	True	
"DUQUEMIN, Mr Joseph Pierre"	3rd Class Passenger	Southampton	Mason	7.55	24	Male	True	
"DWAN, Mr Frank"	3rd Class Passenger	Queenstown	Farm Labourer	7.75	65	Male	False	
"DYKER, Mr Adolf Fredrik"	3rd Class Passenger	Southampton	General Labourer	13.9	23	Male	False	
"DYKER, Mrs Anna Elisabeth Judith"	3rd Class Passenger	Southampton		13.9	22	Female	True	
"EDVARDSSON, Mr Gustaf Hjalmar"	3rd Class Passenger	Southampton	General Labourer	7.775	18	Male	False	
"EKLUND, Mr Hans Linus"	3rd Class Passenger	Southampton	General Labourer	7.775	16	Male	False	
"EKSTRöM, Mr Amandus"	3rd Class Passenger	Southampton	General Labourer	6.975	45	Male	False	
"ELIAS, Mr Dibo"	3rd Class Passenger	Cherbourg	General Labourer	7.225	29	Male	False	
"ELIAS, Mr Joseph jr."	3rd Class Passenger	Cherbourg	General Labourer	7.229166667	15	Male	False	
"ELIAS NASRALLAH, Mr Tannous"	3rd Class Passenger	Cherbourg	General Labourer	7.229166667	22	Male	False	
"ELSBURY, Mr William James"	3rd Class Passenger	Southampton	Farmer	7.25	48	Male	False	
"EMANUEL, Miss Virginia Ethel"	3rd Class Passenger	Southampton		12.475	5	Female	True	
"ESTANISLAU, Mr Manuel Gonçalves"	3rd Class Passenger	Southampton	General Labourer	7.05	37	Male	False	
"EVERETT, Mr Thomas James"	3rd Class Passenger	Southampton	Crane Operator	15.1	38	Male	False	
"FARDON, Mr Charles Richard"	3rd Class Passenger	Southampton	Carpenter / Joiner	7.25	45	Male	False	
"FARRELL, Mr James"	3rd Class Passenger	Queenstown	Farm Labourer	7.75	25	Male	False	
"FINOLI, Mr Luigi"	3rd Class Passenger	Southampton		7.05	34	Male	True	
"FISCHER, Mr Eberhard Thelander"	3rd Class Passenger	Southampton		7.795833333	18	Male	False	
"FLEMING, Miss Honor"	3rd Class Passenger	Queenstown		7.75	22	Female	False	
"FLYNN, Mr James"	3rd Class Passenger	Queenstown	General Labourer	7.75	28	Male	False	
"FLYNN, Mr John"	3rd Class Passenger	Queenstown	Farm Labourer	6.95	42	Male	False	
"FOLEY, Mr Joseph"	3rd Class Passenger	Queenstown	Farm Labourer	7.879166667	19	Male	False	
"FOLEY, Mr William"	3rd Class Passenger	Queenstown	Farm Labourer	7.75	20	Male	False	
"FOO, Mr Choong"	3rd Class Passenger	Southampton	Seaman	56.49583333	32	Male	True	
"FORD, Mr Arthur"	3rd Class Passenger	Southampton	Carpenter / Joiner	8.05	22	Male	False	
"FORD, Mrs Margaret Ann Watson"	3rd Class Passenger	Southampton	Farmer	34.375	20	Female	False	
"FORD, Miss Dollina Margaret"	3rd Class Passenger	Southampton	Servant	34.375	54	Female	False	
"FORD, Mr Edward Watson"	3rd Class Passenger	Southampton	Blacksmith	34.375	18	Male	False	
"FORD, Mr William Neal Thomas"	3rd Class Passenger	Southampton	Messenger	34.375	16	Male	False	
"FORD, Miss Robina Maggie"	3rd Class Passenger	Southampton		34.375	7	Female	False	
"FOX, Mr Patrick"	3rd Class Passenger	Queenstown	General Labourer	7.75	28	Male	False	
"GALLAGHER, Mr Martin"	3rd Class Passenger	Queenstown	Farm Labourer	7.741666667	29	Male	False	
"GARFIRTH, Mr John"	3rd Class Passenger	Southampton	Shoemaker	14.5	21	Male	False	
"GEORGE/JOSEPH, Mrs Shawneene"	3rd Class Passenger	Cherbourg		7.229166667	38	Female	True	
"GERIOS THAMAH, Mr Assaf"	3rd Class Passenger	Cherbourg	Farm Labourer	7.225	21	Male	False	
"GHEORGHEFF, Mr Stanio"	3rd Class Passenger	Cherbourg	General Labourer	7.895833333	0	Male	False	
"GILINSKI, Mr Eliezer"	3rd Class Passenger	Southampton	Locksmith	8.05	22	Male	False	
"GILNAGH, Miss Katherine"	3rd Class Passenger	Queenstown		7.733333333	17	Female	True	
"GLYNN, Miss Mary Agatha"	3rd Class Passenger	Queenstown		7.75	19	Female	True	
"GOLDSMITH, Mr Frank John"	3rd Class Passenger	Southampton	Turner	20.525	33	Male	False	
"GOLDSMITH, Mrs Emily Alice"	3rd Class Passenger	Southampton		20.525	31	Female	True	
"GOLDSMITH, Master Frank John William"	3rd Class Passenger	Southampton		20.525	9	Male	True	
"GOLDSMITH, Mr Nathan"	3rd Class Passenger	Southampton	Shoemaker	7.85	41	Male	False	
"GOODWIN, Mr Frederick Joseph"	3rd Class Passenger	Southampton	Engineer	46.9	42	Male	False	
"GOODWIN, Mrs Augusta"	3rd Class Passenger	Southampton		46.9	43	Female	False	
"GOODWIN, Miss Lillian Amy"	3rd Class Passenger	Southampton	Servant	46.9	16	Female	False	
"GOODWIN, Mr Charles Edward"	3rd Class Passenger	Southampton	Scholar	46.9	14	Male	False	
"GOODWIN, Master William Frederick"	3rd Class Passenger	Southampton		46.9	11	Male	False	
"GOODWIN, Miss Jessie Allis"	3rd Class Passenger	Southampton		46.9	10	Female	False	
"GOODWIN, Master Harold Victor"	3rd Class Passenger	Southampton		46.9	9	Male	False	
"GOODWIN, Master Sidney Leslie"	3rd Class Passenger	Southampton		46.9	1	Male	False	
"GRøNNESTAD, Mr Daniel Danielsen"	3rd Class Passenger	Southampton	General Labourer	8.3625	32	Male	False	
"GREEN, Mr George"	3rd Class Passenger	Southampton	Farrier	8.05	40	Male	False	
"GUEST, Mr Robert"	3rd Class Passenger	Southampton	General Labourer	8.05	23	Male	False	
"GUSTAFSSON, Mr Karl Gideon"	3rd Class Passenger	Southampton	General Labourer	7.775	19	Male	False	
"GUSTAFSSON, Mr Alfred Ossian"	3rd Class Passenger	Southampton	General Labourer	9.845833333	19	Male	False	
"GUSTAFSSON, Mr Anders Vilhelm"	3rd Class Passenger	Southampton	General Labourer	7.925	37	Male	False	
"GUSTAFSSON, Mr Johan Birger"	3rd Class Passenger	Southampton		7.925	28	Male	False	
"HAAS, Miss Aloisia"	3rd Class Passenger	Southampton	General Labourer	8.85	24	Female	False	
"HAGLAND, Mr Ingvald Olai Olsen"	3rd Class Passenger	Southampton	General Labourer	6.966666667	28	Male	False	
"HAGLAND, Mr Konrad Mathias Reiersen"	3rd Class Passenger	Southampton	General Labourer	6.966666667	19	Male	False	
"HAKKARAINEN, Mr Pekka Pietari"	3rd Class Passenger	Southampton	General Labourer	15.85	28	Male	False	
"HAKKARAINEN, Mrs Elin Matilda"	3rd Class Passenger	Southampton		15.85	24	Female	True	
"HAMPE, Mr Léon Jérome"	3rd Class Passenger	Southampton	Painter & Decorator	9.5	19	Male	False	
"HANNA, Mr Boulos"	3rd Class Passenger	Cherbourg	General Labourer	7.225	18	Male	False	
"HANNA, Mr Mansour"	3rd Class Passenger	Cherbourg		7.229166667	35	Male	False	
"HANNAH, Mr Borak ("	3rd Class Passenger	Cherbourg		7.229166667	27	Male	True	
"HANSEN, Mr Claus Peter"	3rd Class Passenger	Southampton	Barber	14.10833333	41	Male	False	
"HANSEN, Mrs Jennie Louise"	3rd Class Passenger	Southampton		14.10833333	45	Female	True	
"HANSEN, Mr Henry Damsgaard"	3rd Class Passenger	Southampton	Manufacturer	7.854166667	21	Male	False	
"HANSEN, Mr Henrik Juul"	3rd Class Passenger	Southampton	Farmer	7.854166667	26	Male	False	
"HARGADON, Miss Catherine"	3rd Class Passenger	Queenstown	Cook	7.733333333	17	Female	False	
"HARKNETT, Miss Alice Phoebe"	3rd Class Passenger	Southampton	Domestic Kitchen Servant	7.55	21	Female	False	
"HART, Mr Henry"	3rd Class Passenger	Queenstown	General Labourer	6.858333333	28	Male	False	
"HASSAN ABILMONA, Mr Houssein Mohamed"	3rd Class Passenger	Cherbourg		18.7875	11	Male	False	
"HEALY, Miss Honor"	3rd Class Passenger	Queenstown		7.75	29	Female	True	
"HEDMAN, Mr Oskar Arvid"	3rd Class Passenger	Southampton	Settler Recruiter	6.975	27	Male	True	
"HEE, Mr Ling"	3rd Class Passenger	Southampton	Seaman	56.49583333	24	Male	True	
"HEGARTY, Miss Hanora"	3rd Class Passenger	Queenstown		6.75	18	Female	False	
"HEIKKINEN, Miss Laina"	3rd Class Passenger	Southampton		7.925	26	Female	True	
"HEININEN, Miss Wendla Maria"	3rd Class Passenger	Southampton	Servant	7.925	23	Female	False	
"HELLSTRöM, Miss Hilda Maria"	3rd Class Passenger	Southampton		8.9625	22	Female	True	
"HENDEKOVIC, Mr Ignjac"	3rd Class Passenger	Southampton	General Labourer	7.895833333	28	Male	False	
"HENRIKSSON, Miss Jenny Lovisa"	3rd Class Passenger	Southampton	Servant	7.775	28	Female	False	
"HENRY, Miss Bridget Delia"	3rd Class Passenger	Queenstown		7.75	21	Female	False	
"HIRVONEN, Mrs Helga Elisabeth Lindqvist"	3rd Class Passenger	Southampton		12.2875	22	Female	True	
"HIRVONEN, Miss Hildur Elisabeth"	3rd Class Passenger	Southampton		12.2875	2	Female	True	
"HOLM, Mr John Fredrik Alexander"	3rd Class Passenger	Southampton	Farmer	6.45	43	Male	False	
"HOLTHEN, Mr Johan Martin"	3rd Class Passenger	Southampton	Seaman	22.525	28	Male	False	
"HONKANEN, Miss Eliina"	3rd Class Passenger	Southampton		7.925	27	Female	True	
"HORGAN, Mr John"	3rd Class Passenger	Queenstown	General Labourer	7.75	22	Male	False	
"HOWARD, Miss May Elizabeth"	3rd Class Passenger	Southampton	Laundry Worker	8.05	26	Female	True	
"HUMBLEN, Mr Adolf Mathias Nicolai Olsen"	3rd Class Passenger	Southampton	Farmer	7.65	42	Male	False	
"HYMAN, Mr Abraham Joseph"	3rd Class Passenger	Southampton	Framer	7.8875	34	Male	True	
"IBRAHIM SHAWAH, Mr Yousseff"	3rd Class Passenger	Cherbourg		14.45833333	33	Male	False	
"IBR?H?M, Mrs S?fiyah"	3rd Class Passenger	Cherbourg		7.229166667	18	Female	True	
"ILIEFF, Mr Ylio"	3rd Class Passenger	Southampton	General Labourer	7.895833333	32	Male	False	
"ILMAKANGAS, Miss Ida Livija"	3rd Class Passenger	Southampton	Servant	7.925	27	Female	False	
"ILMAKANGAS, Miss Pieta Sofia"	3rd Class Passenger	Southampton	Servant	7.925	25	Female	False	
"IVANOFF, Mr Kanio"	3rd Class Passenger	Southampton	General Labourer	7.895833333	20	Male	False	
"JABBUR (ZABOUR), Miss Thamine"	3rd Class Passenger	Cherbourg	Housekeeper	14.45416667	19	Female	False	
"JABBUR (ZABOUR), Miss Hileni"	3rd Class Passenger	Cherbourg	Housekeeper	14.45416667	16	Female	False	
"JALšEVAC, Mr Ivan"	3rd Class Passenger	Cherbourg		7.895833333	29	Male	True	
"JANSSON, Mr Carl Olof"	3rd Class Passenger	Southampton		7.795833333	21	Male	True	
"JARDIM, Mr José Neto"	3rd Class Passenger	Southampton	General Labourer	7.05	21	Male	False	
"JöNSSON, Mr Nils Hilding"	3rd Class Passenger	Southampton	General Labourer	7.854166667	27	Male	False	
"JENSEN, Mr Hans Peder"	3rd Class Passenger	Southampton		7.854166667	20	Male	False	
"JENSEN, Mr Svend Lauritz"	3rd Class Passenger	Southampton	Farmer	7.854166667	17	Male	False	
"JENSEN, Mr Niels Peder"	3rd Class Passenger	Southampton	Farmer	7.054166667	48	Male	False	
"JERMYN, Miss Annie Jane"	3rd Class Passenger	Queenstown		7.75	26	Female	True	
"JOHANNESEN, Mr Bernt Johannes"	3rd Class Passenger	Southampton		8.1125	29	Male	True	
"JOHANSON, Mr Jakob Alfred"	3rd Class Passenger	Southampton	General Labourer	6.495833333	34	Male	False	
"JOHANSSON, Mr Nils"	3rd Class Passenger	Southampton	General Labourer	7.854166667	29	Male	False	
"JOHANSSON, Mr Erik"	3rd Class Passenger	Southampton	General Labourer	7.795833333	22	Male	False	
"JOHANSSON, Mr Gustaf Joel"	3rd Class Passenger	Southampton		8.654166667	33	Male	False	
"JOHANSSON, Mr Karl Johan"	3rd Class Passenger	Southampton		7.775	31	Male	False	
"JOHANSSON PALMQUIST, Mr Oskar Leander"	3rd Class Passenger	Southampton		7.775	26	Male	True	
"JOHNSON, Mr August"	3rd Class Passenger	Southampton	Seaman	0	49	Male	False	
"JOHNSON, Mr William Cahoone Jr."	3rd Class Passenger	Southampton	Seaman	0	19	Male	False	
"JOHNSON, Mr Malkolm Joackim"	3rd Class Passenger	Southampton	General Labourer	7.775	33	Male	False	
"JOHNSON, Mrs Elisabeth Vilhelmina"	3rd Class Passenger	Southampton		11.13333333	26	Female	True	
"JOHNSON, Master Harold Theodor"	3rd Class Passenger	Southampton		11.13333333	4	Male	True	
"JOHNSON, Miss Eleanor Ileen"	3rd Class Passenger	Southampton		11.13333333	1	Female	True	
"JOHNSTON, Mr Andrew Emslie"	3rd Class Passenger	Southampton	Plumber	23.45	35	Male	False	
"JOHNSTON, Mrs Eliza"	3rd Class Passenger	Southampton		23.45	36	Female	False	
"JOHNSTON, Master William Andrew"	3rd Class Passenger	Southampton		23.45	8	Male	False	
"JOHNSTON, Miss Catherine Nellie"	3rd Class Passenger	Southampton		23.45	7	Female	False	
"JONKOFF, Mr Lalio"	3rd Class Passenger	Southampton	General Labourer	7.895833333	23	Male	False	
"JONSSON, Mr Carl"	3rd Class Passenger	Southampton	General Labourer	7.854166667	25	Male	True	
"JOSEPH (SHAHIN), Mr Elias"	3rd Class Passenger	Cherbourg		7.229166667	39	Male	False	
"JUSSILA, Miss Katriina"	3rd Class Passenger	Southampton	Servant	9.841666667	20	Female	False	
"JUSSILA, Miss Mari Aina"	3rd Class Passenger	Southampton	Servant	9.841666667	21	Female	False	
"JUSSILA, Mr Eiriik"	3rd Class Passenger	Southampton		7.925	32	Male	True	
"KALLIO, Mr Nikolai Erland"	3rd Class Passenger	Southampton	General Labourer	7.125	17	Male	False	
"KALVIK, Mr Johannes Halvorsen"	3rd Class Passenger	Southampton	General Labourer	8.433333333	21	Male	False	
"KARAJIC, Mr Milan"	3rd Class Passenger	Southampton	General Labourer	7.895833333	30	Male	False	
"KARLSSON, Mr Einar Gervasius"	3rd Class Passenger	Southampton	Military	7.795833333	21	Male	True	
"KARLSSON, Mr Julius Konrad Eugen"	3rd Class Passenger	Southampton	Engineer	7.854166667	33	Male	False	
"KARLSSON, Mr Nils August"	3rd Class Passenger	Southampton	Farmer	7.520833333	22	Male	False	
"KARUN, Mr Franz"	3rd Class Passenger	Cherbourg	Hotelier	13.41666667	39	Male	True	
"KARUN, Miss Manca"	3rd Class Passenger	Cherbourg		13.41666667	4	Female	True	
"KASSEM HOUSSEIN, Mr Fared"	3rd Class Passenger	Cherbourg	Farmer	7.229166667	18	Male	False	
"KATAVELOS, Mr Vasilios G."	3rd Class Passenger	Cherbourg	Farmer	7.229166667	19	Male	False	
"KEANE, Mr Andrew"	3rd Class Passenger	Queenstown	Farm Labourer	7.75	23	Male	False	
"KEEFE, Mr Arthur"	3rd Class Passenger	Southampton	Farmer	7.25	39	Male	False	
"KELLY, Mr James"	3rd Class Passenger	Southampton	Painter & Decorator	8.05	19	Male	False	
"KELLY, Mr James"	3rd Class Passenger	Queenstown	Farm Labourer	7.829166667	44	Male	False	
"KELLY, Miss Anna Katherine"	3rd Class Passenger	Queenstown		7.75	20	Female	True	
"KELLY, Miss Mary"	3rd Class Passenger	Queenstown		7.75	22	Female	True	
"KENNEDY, Mr John"	3rd Class Passenger	Queenstown	Farm Labourer	7.75	24	Male	True	
"KHALIL, Mr Betros"	3rd Class Passenger	Cherbourg	Farm Labourer	14.45416667	25	Male	False	
"KHALIL, Mrs Zahie"	3rd Class Passenger	Cherbourg	Farm Labourer	14.45416667	20	Female	False	
"KIERNAN, Mr John Joseph"	3rd Class Passenger	Queenstown	General Labourer	7.75	25	Male	False	
"KIERNAN, Mr Philip"	3rd Class Passenger	Queenstown	General Labourer	7.75	22	Male	False	
"KILGANNON, Mr Thomas"	3rd Class Passenger	Queenstown	Farm Labourer	7.7375	22	Male	False	
"KINK, Mr Anton"	3rd Class Passenger	Southampton		22.3	29	Male	True	
"KINK, Miss Maria"	3rd Class Passenger	Southampton		8.6625	22	Female	False	
"KINK, Mr Vincenz"	3rd Class Passenger	Southampton	Magazineer	8.6625	26	Male	False	
"KINK-HEILMANN, Mrs Luise"	3rd Class Passenger	Southampton		22.3	26	Female	True	
"KINK-HEILMANN, Miss Luise Gretchen"	3rd Class Passenger	Southampton		22.3	4	Female	True	
"KLASéN, Mr Klas Albin"	3rd Class Passenger	Southampton	Farm Labourer	7.854166667	18	Male	False	
"KLASéN, Miss Gertrud Emilia"	3rd Class Passenger	Southampton		12.18333333	1	Female	False	
"KLASéN, Mrs Hulda Kristina Eugenia"	3rd Class Passenger	Southampton	Housewife	12.18333333	36	Female	False	
"KRAEFF, Mr Theodor"	3rd Class Passenger	Cherbourg	General Labourer	7.895833333	0	Male	False	
"KREKORIAN, Mr Neshan"	3rd Class Passenger	Cherbourg	General Labourer	7.229166667	25	Male	True	
"KUTSCHER (LITHMAN), Mr Simon"	3rd Class Passenger	Southampton	Baker	7.55	26	Male	False	
"LAHH?D ISHAQ MU'AWWAD, Mr Sark?s"	3rd Class Passenger	Cherbourg	General Labourer	7.225	30	Male	False	
"LAITINEN, Miss Kristina Sofia"	3rd Class Passenger	Southampton	Housekeeper	9.5875	37	Female	False	
"LAM, Mr Ali"	3rd Class Passenger	Southampton	Seaman	56.49583333	38	Male	True	
"LAM, Mr Len"	3rd Class Passenger	Southampton	Seaman	56.49583333	23	Male	False	
"LANDERGREN, Miss Aurora Adelia"	3rd Class Passenger	Southampton		7.25	22	Female	True	
"LANE, Mr Patrick"	3rd Class Passenger	Queenstown	Farm Labourer	7.75	16	Male	False	
"LANG, Mr Fang"	3rd Class Passenger	Southampton	Seaman	56.49583333	32	Male	True	
"LARSSON, Mr August Viktor"	3rd Class Passenger	Southampton	General Labourer	9.483333333	29	Male	False	
"LARSSON, Mr Bengt Edvin"	3rd Class Passenger	Southampton	General Labourer	7.775	29	Male	False	
"LARSSON, Mr Edvard"	3rd Class Passenger	Southampton	Cook	7.775	22	Male	False	
"LEFEBVRE, Mrs Frances Marie"	3rd Class Passenger	Southampton		25.46666667	40	Female	False	
"LEFEBVRE, Master Henry"	3rd Class Passenger	Southampton		25.46666667	5	Male	False	
"LEFEBVRE, Miss Ida"	3rd Class Passenger	Southampton		25.46666667	3	Female	False	
"LEFEBVRE, Miss Jeannie"	3rd Class Passenger	Southampton		25.46666667	8	Female	False	
"LEFEBVRE, Miss Mathilde"	3rd Class Passenger	Southampton		25.46666667	12	Female	False	
"LEINONEN, Mr Antti Gustaf"	3rd Class Passenger	Southampton		7.925	32	Male	False	
"LENNON, Mr Denis"	3rd Class Passenger	Queenstown	General Labourer	15.5	20	Male	False	
"LESTER, Mr James"	3rd Class Passenger	Southampton	Dipper	24.15	26	Male	False	
"LIEVENS, Mr René Aimé"	3rd Class Passenger	Southampton	Farmer	9.5	24	Male	False	
"LINDAHL, Miss Agda Thorilda Viktoria"	3rd Class Passenger	Southampton		7.775	25	Female	False	
"LINDBLOM, Miss Augusta Charlotta"	3rd Class Passenger	Southampton		7.75	45	Female	False	
"LINDELL, Mr Edvard Bengtsson"	3rd Class Passenger	Southampton	General Labourer	15.55	36	Male	False	
"LINDELL, Mrs Elin Gerda"	3rd Class Passenger	Southampton		15.55	30	Female	False	
"LINDQVIST, Mr Eino William"	3rd Class Passenger	Southampton		7.925	20	Male	True	
"LINEHAN, Mr Michael"	3rd Class Passenger	Queenstown	Farm Labourer	7.879166667	21	Male	False	
"LING, Mr Lee"	3rd Class Passenger	Southampton	Seaman	56.49583333	28	Male	False	
"LINHART, Mr Wenzel"	3rd Class Passenger	Southampton	Baker	9.5	27	Male	False	
"LIVSHIN, Mr David"	3rd Class Passenger	Southampton	Jeweller	7.25	25	Male	False	
"LOBB, Mr William Arthur"	3rd Class Passenger	Southampton	Engineer	16.1	30	Male	False	
"LOBB, Mrs Cordelia K."	3rd Class Passenger	Southampton		16.1	26	Female	False	
"LOCKYER, Mr Edward Thomas"	3rd Class Passenger	Southampton	Grocers Assistant	7.879166667	19	Male	False	
"LOVELL, Mr John Hall"	3rd Class Passenger	Southampton	Farmer	7.25	20	Male	False	
"LULIC, Mr Nikola"	3rd Class Passenger	Southampton		8.6625	29	Male	True	
"LUNDAHL, Mr Johan Svensson"	3rd Class Passenger	Southampton	General Labourer	7.054166667	51	Male	False	
"LUNDIN, Miss Olga Elida"	3rd Class Passenger	Southampton		7.854166667	23	Female	True	
"LUNDSTRöM, Mr Thure Edvin"	3rd Class Passenger	Southampton		7.579166667	32	Male	True	
"LYMPEROPOULUS, Mr Panagiotis K."	3rd Class Passenger	Cherbourg	General Labourer	6.4375	30	Male	False	
"LYNTAKOFF, Mr Stanko"	3rd Class Passenger	Southampton	General Labourer	7.895833333	44	Male	False	
"MACKAY, Mr George William"	3rd Class Passenger	Southampton	Footman	7.55	20	Male	False	
"MADIGAN, Miss Margaret"	3rd Class Passenger	Queenstown		7.75	21	Female	True	
"MADSEN, Mr Fridtjof Arne"	3rd Class Passenger	Southampton		7.141666667	24	Male	True	
"MAHON, Miss Bridget Delia"	3rd Class Passenger	Queenstown		7.879166667	20	Female	False	
"MAISNER, Mr Simon"	3rd Class Passenger	Southampton	Tailor	8.05	34	Male	False	
"MANGAN, Miss Mary"	3rd Class Passenger	Queenstown		7.75	32	Female	False	
"MANNION, Miss Margaret"	3rd Class Passenger	Queenstown		7.7375	28	Female	True	
"MARDIROSIAN, Mr Sarkis"	3rd Class Passenger	Cherbourg	Farm Labourer	7.229166667	25	Male	False	
"MARINKO, Mr Dmitri"	3rd Class Passenger	Southampton		7.895833333	23	Male	False	
"MARKOFF, Mr Marin"	3rd Class Passenger	Southampton	General Labourer	7.895833333	35	Male	False	
"MARKUN, Mr Johann"	3rd Class Passenger	Cherbourg	General Labourer	7.895833333	33	Male	False	
"MATINOFF, Mr Nicola"	3rd Class Passenger	Cherbourg		7.895833333	30	Male	False	
"M?M?, Mr Hann? Mik?'?l"	3rd Class Passenger	Cherbourg		7.229166667	18	Male	True	
"MäENPää, Mr Matti Alexanteri"	3rd Class Passenger	Southampton		7.125	22	Male	False	
"MäKINEN, Mr Kalle Edvard"	3rd Class Passenger	Southampton	General Labourer	7.925	29	Male	False	
"MCCARTHY, Miss Catherine"	3rd Class Passenger	Queenstown		7.75	24	Female	True	
"MCCORMACK, Mr Thomas Joseph"	3rd Class Passenger	Queenstown	Barman	7.75	19	Male	True	
"MCCOY, Miss Agnes"	3rd Class Passenger	Queenstown		23.25	29	Female	True	
"MCCOY, Miss Alice"	3rd Class Passenger	Queenstown		23.25	26	Female	True	
"MCCOY, Mr Bernard"	3rd Class Passenger	Queenstown	General Labourer	23.25	24	Male	True	
"MCDERMOTT, Miss Bridget Delia"	3rd Class Passenger	Queenstown		7.783333333	31	Female	True	
"MCEVOY, Mr Michael"	3rd Class Passenger	Queenstown	Farm Labourer	15.5	19	Male	False	
"MCGOVERN, Ms Mary"	3rd Class Passenger	Queenstown		7.879166667	22	Female	True	
"MCGOWAN, Miss Catherine"	3rd Class Passenger	Queenstown		7.75	42	Female	False	
"MCGOWAN, Miss Anna Louise"	3rd Class Passenger	Queenstown		8.35	17	Female	True	
"MCMAHON, Mr Martin"	3rd Class Passenger	Queenstown	Farm Labourer	7.75	19	Male	False	
"MCNAMEE, Mr Neal"	3rd Class Passenger	Southampton	Provision Manager	16.1	27	Male	False	
"MCNAMEE, Mrs Eileen"	3rd Class Passenger	Southampton		16.1	19	Female	False	
"MCNEILL, Miss Bridget"	3rd Class Passenger	Queenstown		7.75	32	Female	False	
"MEANWELL, Mrs Marian"	3rd Class Passenger	Southampton	Milliner	8.05	63	Female	False	
"MEEHAN, Mr John"	3rd Class Passenger	Queenstown	General Labourer	7.75	22	Male	False	
"MEEK, Mrs Annie Louisa"	3rd Class Passenger	Southampton		8.05	31	Female	False	
"MEO (MARTINO), Mr Alfonzo"	3rd Class Passenger	Southampton	Musician	8.05	48	Male	False	
"MERNAGH, Mr Robert"	3rd Class Passenger	Queenstown	Farm Labourer	7.75	28	Male	False	
"MIDTSJø, Mr Karl Albert"	3rd Class Passenger	Southampton	Farmer	7.775	21	Male	True	
"MIHOFF, Mr Stoytcho"	3rd Class Passenger	Southampton	General Labourer	7.895833333	28	Male	False	
"MILES, Mr Frank"	3rd Class Passenger	Southampton	Engineer	8.05	23	Male	False	
"MINEFF, Mr Ivan"	3rd Class Passenger	Southampton	General Labourer	7.895833333	24	Male	False	
"MINKOFF, Mr Lazar"	3rd Class Passenger	Southampton	General Labourer	7.895833333	21	Male	False	
"MITKOFF, Mr Mito"	3rd Class Passenger	Southampton	General Labourer	7.895833333	23	Male	False	
"MOCKLER, Miss Ellen Mary"	3rd Class Passenger	Queenstown		7.879166667	23	Female	True	
"MOEN, Mr Sigurd Hansen"	3rd Class Passenger	Southampton	Carpenter / Joiner	7.65	27	Male	False	
"MOOR, Mrs Beila"	3rd Class Passenger	Southampton	Tailor	12.475	29	Female	True	
"MOOR, Master Meier"	3rd Class Passenger	Southampton		12.475	7	Male	True	
"MOORE, Mr Leonard Charles"	3rd Class Passenger	Southampton	Bricklayer	8.05	19	Male	False	
"MORAN, Miss Bridget"	3rd Class Passenger	Queenstown		24.15	28	Female	True	
"MORAN, Mr Daniel J."	3rd Class Passenger	Queenstown	General Labourer	24.15	27	Male	False	
"MORLEY, Mr William"	3rd Class Passenger	Southampton	Carpenter / Joiner	8.05	34	Male	False	
"MORROW, Mr Thomas Rowan"	3rd Class Passenger	Queenstown	General Labourer	7.75	30	Male	False	
"MOSS, Mr Albert Johan"	3rd Class Passenger	Southampton		7.775	29	Male	True	
"MOUSSA, Mrs Mantoura Boulos"	3rd Class Passenger	Cherbourg	Housewife	7.229166667	35	Female	True	
"MOUTAL, Mr Rahamin Haim"	3rd Class Passenger	Southampton	Traveller	8.05	28	Male	False	
"MUB?RIK, Mrs Am?nah"	3rd Class Passenger	Cherbourg		15.24583333	24	Female	True	
"MUB?RIK, Master Jirjis"	3rd Class Passenger	Cherbourg		15.24583333	7	Male	True	
"MUB?RIK, Master Hal?m"	3rd Class Passenger	Cherbourg		15.24583333	4	Male	True	
"MULLIN, Miss Catherine"	3rd Class Passenger	Queenstown		7.733333333	21	Female	True	
"MULLIN, Miss Mary (_Lennon)"	3rd Class Passenger	Queenstown		15.5	18	Female	False	
"MULVIHILL, Miss Bridget Elizabeth"	3rd Class Passenger	Queenstown		7.75	25	Female	True	
"MURDLIN, Mr Joseph"	3rd Class Passenger	Southampton	Chemist	8.05	22	Male	False	
"MURPHY, Miss Nora"	3rd Class Passenger	Queenstown		15.5	34	Female	True	
"MURPHY, Miss Margaret Jane"	3rd Class Passenger	Queenstown		15.5	25	Female	True	
"MURPHY, Miss Catherine"	3rd Class Passenger	Queenstown		15.5	18	Female	True	
"MUSLAM?N?, Mrs Fat?mah Muhammad"	3rd Class Passenger	Cherbourg		7.225	22	Female	True	
"MYHRMAN, Mr Pehr Fabian Oliver Malkolm"	3rd Class Passenger	Southampton	Clerk	7.75	18	Male	False	
"NAIDENOFF, Mr Penko"	3rd Class Passenger	Southampton	General Labourer	7.895833333	22	Male	False	
"NAJIB KIAMIE, Miss Adele ""Jane"""	3rd Class Passenger	Cherbourg		7.225	15	Female	True	
"NAKHLI, Mr Toufik"	3rd Class Passenger	Cherbourg		7.229166667	17	Male	False	
"NAKID, Mr Sahid"	3rd Class Passenger	Cherbourg		15.74166667	20	Male	True	
"NAKID, Mrs Waika ""Mary"""	3rd Class Passenger	Cherbourg		15.74166667	19	Female	True	
"NAKID, Miss Maria"	3rd Class Passenger	Cherbourg		15.74166667	1	Female	True	
"NANCARROW, Mr William Henry"	3rd Class Passenger	Southampton	Mason	8.05	36	Male	False	
"NANKOFF, Mr Minko"	3rd Class Passenger	Southampton	General Labourer	7.895833333	32	Male	False	
"NASR 'ALM?, Mr Mustafà"	3rd Class Passenger	Cherbourg	Farm Labourer	7.229166667	20	Male	False	
"NASSR RIZQ, Mr Saade"	3rd Class Passenger	Cherbourg		7.225	20	Male	False	
"NAUGHTON, Miss Hannah"	3rd Class Passenger	Queenstown	Teacher	7.75	21	Female	False	
"N?Q?LA Y?RID, Miss Jamilah"	3rd Class Passenger	Cherbourg		11.24166667	14	Female	True	
"N?Q?LA Y?RID, Master Ily?s"	3rd Class Passenger	Cherbourg		11.24166667	11	Male	True	
"NENKOFF, Mr Christo"	3rd Class Passenger	Southampton	General Labourer	7.895833333	22	Male	False	
"NIEMINEN, Miss Manta Josefina"	3rd Class Passenger	Southampton	Servant	7.925	29	Female	False	
"NIKLASSON, Mr Samuel"	3rd Class Passenger	Southampton	General Labourer	8.05	28	Male	False	
"NILSSON, Mr August Ferdinand"	3rd Class Passenger	Southampton	General Labourer	7.854166667	21	Male	False	
"NILSSON, Miss Berta Olivia"	3rd Class Passenger	Southampton		7.775	18	Female	True	
"NILSSON, Miss Helmina Josefina"	3rd Class Passenger	Southampton		7.854166667	26	Female	True	
"NIRVA, Mr Iisakki Antino Äijö"	3rd Class Passenger	Southampton	General Labourer	7.125	41	Male	False	
"NISKäNEN, Mr Juha"	3rd Class Passenger	Southampton		7.925	39	Male	True	
"NOFAL, Mr Mansouer"	3rd Class Passenger	Cherbourg	Journalist	7.229166667	20	Male	False	
"NOSWORTHY, Mr Richard Cater"	3rd Class Passenger	Southampton	Farm Labourer	7.8	21	Male	False	
"NYSTEN, Miss Anna Sofia"	3rd Class Passenger	Southampton		7.75	22	Female	True	
"NYSVEEN, Mr Johan Hansen"	3rd Class Passenger	Southampton	Farmer	6.2375	60	Male	False	
"O'BRIEN, Mr Denis"	3rd Class Passenger	Queenstown	Postal Clerk / Postman	7.829166667	21	Male	False	
"O'BRIEN, Mr Thomas"	3rd Class Passenger	Queenstown	Farm Labourer	15.5	27	Male	False	
"O'BRIEN, Mrs Johanna ""Hannah"""	3rd Class Passenger	Queenstown	Housewife	15.5	26	Female	True	
"O'CONNELL, Mr Patrick Denis"	3rd Class Passenger	Queenstown	General Labourer	7.733333333	17	Male	False	
"O'CONNOR, Mr Maurice"	3rd Class Passenger	Queenstown	General Labourer	7.75	16	Male	False	
"O'CONNOR, Mr Patrick"	3rd Class Passenger	Queenstown	Farmer	7.75	23	Male	False	
"O'DWYER, Miss Ellen"	3rd Class Passenger	Queenstown		7.879166667	25	Female	True	
"O'KEEFE, Mr Patrick"	3rd Class Passenger	Queenstown	Farm Labourer	7.75	21	Male	True	
"O'LEARY, Miss Hanora ""Nora"""	3rd Class Passenger	Queenstown		7.829166667	16	Female	True	
"O'SULLIVAN, Miss Bridget Mary"	3rd Class Passenger	Queenstown		7.629166667	21	Female	False	
"OLSEN, Mr Karl Siegwart Andreas"	3rd Class Passenger	Southampton	General Labourer	8.404166667	42	Male	False	
"OLSEN, Master Artur Karl"	3rd Class Passenger	Southampton		3.170833333	9	Male	True	
"OLSEN, Mr Henry Margido"	3rd Class Passenger	Southampton	Engineer	22.525	28	Male	False	
"OLSEN, Mr Ole Martin"	3rd Class Passenger	Southampton	General Labourer	7.3125	27	Male	False	
"OLSSON, Mr Oscar Wilhelm"	3rd Class Passenger	Southampton		7.775	32	Male	True	
"OLSSON, Mr Nils Johan Göransson"	3rd Class Passenger	Southampton		7.854166667	28	Male	False	
"OLSSON, Miss Elina"	3rd Class Passenger	Southampton		7.854166667	31	Female	False	
"OLSVIGEN, Mr Thor Anderson"	3rd Class Passenger	Southampton	Salesman	9.225	20	Male	False	
"ORESKOVIC, Mr Luka"	3rd Class Passenger	Southampton	Farmer	8.6625	20	Male	False	
"ORESKOVIC, Miss Jelka"	3rd Class Passenger	Southampton	Farmer	8.6625	23	Female	False	
"ORESKOVIC, Miss Marija"	3rd Class Passenger	Southampton	Farm Labourer	8.6625	20	Female	False	
"OSéN, Mr Olaf Elon"	3rd Class Passenger	Southampton	Farm Labourer	9.216666667	16	Male	False	
"PANULA, Mrs Maija Emelia Abrahamintytar"	3rd Class Passenger	Southampton		39.6875	41	Female	False	
"PANULA, Master Jaako Arnold"	3rd Class Passenger	Southampton	General Labourer	39.6875	14	Male	False	
"PANULA, Mr Ernesti Arvid"	3rd Class Passenger	Southampton	General Labourer	39.6875	16	Male	False	
"PANULA, Master Juha Niilo"	3rd Class Passenger	Southampton		39.6875	7	Male	False	
"PANULA, Master Urho Abraham"	3rd Class Passenger	Southampton		39.6875	2	Male	False	
"PANULA, Master Eino Viljam"	3rd Class Passenger	Southampton		39.6875	1	Male	False	
"PASIC, Mr Jakob"	3rd Class Passenger	Southampton	Farmer	8.6625	21	Male	False	
"PATCHETT, Mr George"	3rd Class Passenger	Southampton	Shoemaker	14.5	19	Male	False	
"PAVLOVIC, Mr Stefo"	3rd Class Passenger	Southampton	General Labourer	7.895833333	32	Male	False	
"PåLSSON, Mrs Alma Cornelia"	3rd Class Passenger	Southampton	Housewife	21.075	29	Female	False	
"PåLSSON, Master Gösta Leonard"	3rd Class Passenger	Southampton		21.075	2	Male	False	
"PåLSSON, Master Paul Folke"	3rd Class Passenger	Southampton		21.075	6	Male	False	
"PåLSSON, Miss Stina Viola"	3rd Class Passenger	Southampton		21.075	3	Female	False	
"PåLSSON, Miss Torborg Danira"	3rd Class Passenger	Southampton		21.075	8	Female	False	
"PEACOCK, Mrs Edith"	3rd Class Passenger	Southampton		13.775	26	Female	False	
"PEACOCK, Master Albert Edward"	3rd Class Passenger	Southampton		13.775	0.583333333	Male	False	
"PEACOCK, Miss Treasteall"	3rd Class Passenger	Southampton		13.775	3	Female	False	
"PEARCE, Mr Ernest"	3rd Class Passenger	Southampton	Farmer	7	32	Male	False	
"PEDERSEN, Mr Olaf"	3rd Class Passenger	Southampton	General Labourer	7.775	28	Male	False	
"PEDUZZI, Mr Giuseppe"	3rd Class Passenger	Southampton	Waiter	8.05	24	Male	False	
"PEKONIEMI, Mr Edvard"	3rd Class Passenger	Southampton	General Labourer	7.925	21	Male	False	
"PELTOMäKI, Mr Nikolai Johannes"	3rd Class Passenger	Southampton	General Labourer	7.925	25	Male	False	
"PERKIN, Mr John Henry"	3rd Class Passenger	Southampton	Farmer	7.25	22	Male	False	
"PERSSON, Mr Ernst Ulrik"	3rd Class Passenger	Southampton	Chauffeur	7.775	25	Male	True	
"PETER / JOSEPH, Mrs Catherine"	3rd Class Passenger	Cherbourg		22.35833333	24	Female	True	
"PETER / JOSEPH, Master Michael J. (""Michael Joseph"")"	3rd Class Passenger	Cherbourg		22.35833333	4	Male	True	
"PETER / JOSEPH, Miss Anna (""Mary Joseph"")"	3rd Class Passenger	Cherbourg		22.35833333	2	Female	True	
"PETERS, Miss Catherine"	3rd Class Passenger	Queenstown		8.1375	26	Female	False	
"PETERSEN, Mr Marius"	3rd Class Passenger	Southampton	Dairy Worker	8.05	24	Male	False	
"PETRANEC, Miss Matilda"	3rd Class Passenger	Southampton	Servant	7.895833333	28	Female	False	
"PETROFF, Mr Nedialco"	3rd Class Passenger	Southampton	General Labourer	7.895833333	19	Male	False	
"PETROFF, Mr Pastcho"	3rd Class Passenger	Southampton	General Labourer	7.895833333	29	Male	False	
"PETTERSSON, Mr Johan Emil"	3rd Class Passenger	Southampton	General Labourer	7.775	25	Male	False	
"PETTERSSON, Miss Elin Natalia"	3rd Class Passenger	Southampton		7.775	18	Female	False	
"PICARD, Mr Benoît"	3rd Class Passenger	Southampton	Leather Worker	8.05	32	Male	True	
"PLOTCHARSKY, Mr Vasil"	3rd Class Passenger	Southampton	General Labourer	7.895833333	27	Male	False	
"POKRNIC, Mr Mate"	3rd Class Passenger	Southampton		8.6625	17	Male	False	
"POKRNIC, Mr Tome"	3rd Class Passenger	Southampton		8.6625	24	Male	False	
"PULNER, Mr Uscher"	3rd Class Passenger	Cherbourg		8.7125	16	Male	False	
"RADEFF, Mr Alexander"	3rd Class Passenger	Southampton	General Labourer	7.895833333	27	Male	False	
"RASMUSSEN, Mrs Lena Jakobsen"	3rd Class Passenger	Southampton		8.1125	63	Female	False	
"RAZI, Mr Raihed"	3rd Class Passenger	Cherbourg		7.229166667	30	Male	False	
"REED, Mr James George"	3rd Class Passenger	Southampton	Butcher	7.25	19	Male	False	
"REKIC, Mr Tido"	3rd Class Passenger	Southampton	General Labourer	7.895833333	38	Male	False	
"REYNOLDS, Mr Harold"	3rd Class Passenger	Southampton	Baker	8.05	21	Male	False	
"RICE, Mrs Margaret"	3rd Class Passenger	Queenstown	Housekeeper	29.125	39	Female	False	
"RICE, Master Albert"	3rd Class Passenger	Queenstown		29.125	10	Male	False	
"RICE, Master George Hugh"	3rd Class Passenger	Queenstown		29.125	8	Male	False	
"RICE, Master Eric"	3rd Class Passenger	Queenstown		29.125	7	Male	False	
"RICE, Master Arthur"	3rd Class Passenger	Queenstown		29.125	4	Male	False	
"RICE, Master Eugene Francis"	3rd Class Passenger	Queenstown		29.125	2	Male	False	
"RIIHIVUORI, Miss Susanna Juhantytär"	3rd Class Passenger	Southampton		39.6875	22	Female	False	
"RINTAMäKI, Mr Matti"	3rd Class Passenger	Southampton	General Labourer	7.125	35	Male	False	
"RIORDAN, Miss Hannah"	3rd Class Passenger	Queenstown		7.720833333	18	Female	True	
"RISIEN, Mr Samuel Beard"	3rd Class Passenger	Southampton	Hotelier	14.5	69	Male	False	
"RISIEN, Mrs Emma Jane"	3rd Class Passenger	Southampton		14.5	58	Female	False	
"ROBINS, Mr Alexander A."	3rd Class Passenger	Southampton	Mason	14.5	50	Male	False	
"ROBINS, Mrs Charity"	3rd Class Passenger	Southampton		14.5	47	Female	False	
"ROGERS, Mr William John"	3rd Class Passenger	Southampton	Miner	8.05	29	Male	False	
"ROMMETVEDT, Mr Knud Paust"	3rd Class Passenger	Southampton	Tailor	7.775	49	Male	False	
"ROSBLOM, Mrs Helena Wilhelmina"	3rd Class Passenger	Southampton		20.2125	41	Female	False	
"ROSBLOM, Miss Salli Helena"	3rd Class Passenger	Southampton		20.2125	2	Female	False	
"ROSBLOM, Mr Viktor Richard"	3rd Class Passenger	Southampton	General Labourer	20.2125	18	Male	False	
"ROTH, Miss Sarah"	3rd Class Passenger	Southampton	Tailor	8.05	31	Female	True	
"ROUSE, Mr Richard Henry"	3rd Class Passenger	Southampton	Farm Labourer	8.05	53	Male	False	
"RUSH, Mr Alfred George John"	3rd Class Passenger	Southampton	Porter	8.05	17	Male	False	
"RYAN, Mr Patrick"	3rd Class Passenger	Queenstown	General Labourer	24.15	30	Male	False	
"RYAN, Mr Edward"	3rd Class Passenger	Queenstown	General Labourer	7.75	24	Male	True	
"SAAD, Mr Amin"	3rd Class Passenger	Cherbourg	Farm Labourer	7.229166667	30	Male	False	
"SAAD, Mr Khalil"	3rd Class Passenger	Cherbourg	Farm Labourer	7.225	27	Male	False	
"SADLIER, Mr Matthew"	3rd Class Passenger	Queenstown	Farm Labourer	7.729166667	18	Male	False	
"SADOWITZ, Mr Henry"	3rd Class Passenger	Southampton	Fur Cutter	7.591666667	17	Male	False	
"SAGE, Mr John George"	3rd Class Passenger	Southampton	Tradesman	69.55	44	Male	False	
"SAGE, Mrs Annie Elizabeth"	3rd Class Passenger	Southampton		69.55	44	Female	False	
"SAGE, Miss Stella Anne"	3rd Class Passenger	Southampton	Dressmaker / Couturi?re	69.55	20	Female	False	
"SAGE, Mr George John"	3rd Class Passenger	Southampton	Barman	69.55	19	Male	False	
"SAGE, Mr Douglas Bullen"	3rd Class Passenger	Southampton	Baker	69.55	18	Male	False	
"SAGE, Mr Frederick"	3rd Class Passenger	Southampton	Cook	69.55	16	Male	False	
"SAGE, Miss Dorothy"	3rd Class Passenger	Southampton	Scholar	69.55	14	Female	False	
"SAGE, Master Anthony William"	3rd Class Passenger	Southampton		69.55	12	Male	False	
"SAGE, Miss Elizabeth Ada"	3rd Class Passenger	Southampton		69.55	10	Female	False	
"SAGE, Miss Constance Gladys"	3rd Class Passenger	Southampton		69.55	7	Female	False	
"SAGE, Master Thomas Henry"	3rd Class Passenger	Southampton		69.55	4	Male	False	
"SALANDER, Mr Karl Johan"	3rd Class Passenger	Southampton	General Labourer	9.325	24	Male	False	
"SALKJELSVIK, Miss Anna Kristine"	3rd Class Passenger	Southampton		7.65	21	Female	True	
"SALONEN, Mr Johan Werner"	3rd Class Passenger	Southampton	General Labourer	7.925	29	Male	False	
"SAMAAN, Mr Hanna Elias"	3rd Class Passenger	Cherbourg	General Labourer	21.67916667	40	Male	False	
"SAMAAN, Mr Elias"	3rd Class Passenger	Cherbourg	General Labourer	21.67916667	17	Male	False	
"SAMAAN, Mr Youssef"	3rd Class Passenger	Cherbourg	General Labourer	21.67916667	16	Male	False	
"SANDSTRöM, Mrs Agnes Charlotta"	3rd Class Passenger	Southampton		16.7	24	Female	True	
"SANDSTRöM, Miss Beatrice Irene"	3rd Class Passenger	Southampton		16.7	1	Female	True	
"SANDSTRöM, Miss Marguerite Rut"	3rd Class Passenger	Southampton		16.7	4	Female	True	
"SAP, Mr Julius (""Jules _"")"	3rd Class Passenger	Southampton		9.5	21	Male	True	
"SAUNDERCOCK, Mr William Henry"	3rd Class Passenger	Southampton	Miner	8.05	19	Male	False	
"SAWYER, Mr Frederick Charles"	3rd Class Passenger	Southampton	Gardener	8.05	33	Male	False	
"SæTHER, Mr Simon Sivertsen"	3rd Class Passenger	Southampton	Miner	7.25	43	Male	False	
"SøHOLT, Mr Peter Andreas Lauritz Andersen"	3rd Class Passenger	Southampton	Carpenter / Joiner	7.65	19	Male	False	
"SCANLAN, Mr James"	3rd Class Passenger	Queenstown		7.725	22	Male	False	
"SCHEERLINCK, Mr Jean"	3rd Class Passenger	Southampton		9.5	29	Male	True	
"SDYCOFF, Mr Todor"	3rd Class Passenger	Southampton		7.895833333	42	Male	False	
"SEMAN, Master Betros"	3rd Class Passenger	Cherbourg		4.15	10	Male	False	
"SHANNON, Mr Andrew John"	3rd Class Passenger	Southampton	Seaman	0	36	Male	False	
"SHAUGHNESSY, Mr Patrick"	3rd Class Passenger	Queenstown	Farm Labourer	7.75	24	Male	False	
"SHEDID, Mr Daher"	3rd Class Passenger	Cherbourg		7.225	19	Male	False	
"SHELLARD, Mr Frederick William Blainey"	3rd Class Passenger	Southampton	Painter & Decorator	15.1	55	Male	False	
"SHIH?B, Mr Al-Am?r F?ris"	3rd Class Passenger	Cherbourg	General Labourer	7.225	29	Male	False	
"SHINE, Miss Ellen"	3rd Class Passenger	Queenstown		7.829166667	20	Female	True	
"SHORNEY, Mr Charles Joseph"	3rd Class Passenger	Southampton	Valet	8.05	22	Male	False	
"SIMMONS, Mr John"	3rd Class Passenger	Southampton	General Labourer	8.05	40	Male	False	
"SIRAYANIAN, Mr Orsen"	3rd Class Passenger	Cherbourg	Farmer	7.229166667	22	Male	False	
"SIROTA, Mr Morris"	3rd Class Passenger	Southampton	Tailor	8.05	20	Male	False	
"SIVIC, Mr Husein"	3rd Class Passenger	Southampton	General Labourer	7.895833333	40	Male	False	
"SIVOLA, Mr Antti Wilhelm"	3rd Class Passenger	Southampton	General Labourer	7.925	21	Male	False	
"SJöBLOM, Miss Anna Sofia"	3rd Class Passenger	Southampton		6.495833333	18	Female	True	
"SKOOG, Mr Wilhelm Johansson"	3rd Class Passenger	Southampton	General Labourer	27.9	40	Male	False	
"SKOOG, Mrs Anna Bernhardina"	3rd Class Passenger	Southampton		27.9	43	Female	False	
"SKOOG, Master Karl Thorsten"	3rd Class Passenger	Southampton		27.9	11	Male	False	
"SKOOG, Master Harald"	3rd Class Passenger	Southampton		27.9	5	Male	False	
"SKOOG, Miss Mabel"	3rd Class Passenger	Southampton		27.9	9	Female	False	
"SKOOG, Miss Margit Elizabeth"	3rd Class Passenger	Southampton		27.9	2	Female	False	
"SLABENOFF, Mr Petco"	3rd Class Passenger	Southampton	General Labourer	7.895833333	42	Male	False	
"SLOCOVSKI, Mr Selman Francis"	3rd Class Passenger	Southampton	Merchant	8.05	20	Male	False	
"SMILJANIC, Mr Mile"	3rd Class Passenger	Southampton	Farm Labourer	8.6625	37	Male	False	
"SMYTH, Mr Thomas"	3rd Class Passenger	Queenstown		7.75	26	Male	False	
"SMYTH, Miss Julia"	3rd Class Passenger	Queenstown		7.733333333	17	Female	True	
"SOMERTON, Mr Francis William"	3rd Class Passenger	Southampton		8.05	30	Male	False	
"SPECTOR, Mr Woolf"	3rd Class Passenger	Southampton	General Labourer	8.05	23	Male	False	
"SPINNER, Mr Henry John"	3rd Class Passenger	Southampton	Glove Cutter	8.05	32	Male	False	
"STANEFF, Mr Ivan"	3rd Class Passenger	Southampton	General Labourer	7.895833333	23	Male	False	
"STANKOVIC, Mr Ivan"	3rd Class Passenger	Cherbourg	General Labourer	8.6875	33	Male	False	
"STANLEY, Miss Amy Zillah Elsie"	3rd Class Passenger	Southampton	Servant	7.55	24	Female	True	
"STANLEY, Mr Edward Roland"	3rd Class Passenger	Southampton	Porter	8.05	21	Male	False	
"STOREY, Mr Thomas"	3rd Class Passenger	Southampton	Seaman	0	51	Male	False	
"STOYTCHEFF, Mr Ilia"	3rd Class Passenger	Southampton	General Labourer	7.895833333	19	Male	False	
"STRANDéN, Mr Juho Niilosson"	3rd Class Passenger	Southampton		7.925	31	Male	True	
"STRANDBERG, Miss Ida Sofia"	3rd Class Passenger	Southampton		9.8375	22	Female	False	
"STRöM, Mrs Elna Matilda"	3rd Class Passenger	Southampton		10.4625	29	Female	False	
"STRöM, Miss Telma Matilda"	3rd Class Passenger	Southampton		10.4625	2	Female	False	
"STRILIC, Mr Ivan"	3rd Class Passenger	Southampton	Farmer	8.6625	27	Male	False	
"SUNDERLAND, Mr Victor Francis"	3rd Class Passenger	Southampton	Farmer	8.05	20	Male	True	
"SUNDMAN, Mr Johan Julian"	3rd Class Passenger	Southampton		7.925	44	Male	True	
"SUTEHALL, Mr Henry Jr"	3rd Class Passenger	Southampton	Coach Trimmer	7.05	25	Male	False	
"SVENSSON, Mr Olof"	3rd Class Passenger	Southampton	Farmer	7.795833333	24	Male	False	
"SVENSSON, Mr Johan"	3rd Class Passenger	Southampton		7.775	74	Male	False	
"SVENSSON, Mr Johan Cervin"	3rd Class Passenger	Southampton		9.225	14	Male	True	
"TANN?S, Mr Bash?r"	3rd Class Passenger	Cherbourg	Dealer	6.4375	31	Male	False	
"TANN?S, Mrs Tham?n"	3rd Class Passenger	Cherbourg		8.516666667	16	Female	True	
"TANN?S, Master As'ad"	3rd Class Passenger	Cherbourg		8.516666667	0.416666667	Male	True	
"TöRBER, Mr Ernst Wilhelm"	3rd Class Passenger	Southampton	Florist	8.05	41	Male	False	
"TöRNQUIST, Mr William Henry"	3rd Class Passenger	Southampton	Seaman	0	25	Male	True	
"TENGLIN, Mr Gunnar Isidor"	3rd Class Passenger	Southampton		7.795833333	25	Male	True	
"THEOBALD, Mr Thomas Leonard"	3rd Class Passenger	Southampton	Groom	8.05	34	Male	False	
"THOMAS/TANNOUS, Mr Tannous"	3rd Class Passenger	Cherbourg	Scholar	7.225	16	Male	False	
"THOMAS/TANNOUS, Mr John"	3rd Class Passenger	Cherbourg	Dealer	6.4375	34	Male	False	
"THOMPSON, Mr Alexander Morrison"	3rd Class Passenger	Southampton	Mason	8.05	36	Male	False	
"THORNEYCROFT, Mr Percival"	3rd Class Passenger	Southampton	General Labourer	16.1	36	Male	False	
"THORNEYCROFT, Mrs Florence Kate"	3rd Class Passenger	Southampton		16.1	32	Female	True	
"TIKKANEN, Mr Juho"	3rd Class Passenger	Southampton	General Labourer	7.925	32	Male	False	
"TOBIN, Mr Roger"	3rd Class Passenger	Queenstown	Farmer	7.75	20	Male	False	
"TODOROFF, Mr Lalio"	3rd Class Passenger	Southampton	General Labourer	7.895833333	23	Male	False	
"TOMLIN, Mr Ernest Portage"	3rd Class Passenger	Southampton	Scholar	8.05	22	Male	False	
"TORFA, Mr Assad"	3rd Class Passenger	Cherbourg	Farm Labourer	7.229166667	20	Male	False	
"TOTEVSKI, Mr Hristo Danchev"	3rd Class Passenger	Southampton	General Labourer	7.895833333	25	Male	False	
"TU'MAH, Mrs Hinnah"	3rd Class Passenger	Cherbourg		15.24583333	27	Female	True	
"TU'MAH, Miss Mariyam"	3rd Class Passenger	Cherbourg		15.24583333	9	Female	True	
"TU'MAH, Master Jirjis Y?suf"	3rd Class Passenger	Cherbourg		15.24583333	8	Male	True	
"TURCIN, Mr Stjepan"	3rd Class Passenger	Southampton	General Labourer	7.895833333	36	Male	False	
"TURJA, Miss Anna Sofia"	3rd Class Passenger	Southampton		9.841666667	18	Female	True	
"TURKULA, Mrs Hedwig"	3rd Class Passenger	Southampton		9.5875	63	Female	True	
"VAN BILLIARD, Mr Austin Blyler"	3rd Class Passenger	Southampton		14.5	35	Male	False	
"VAN BILLIARD, Master James William"	3rd Class Passenger	Southampton		14.5	10	Male	False	
"VAN BILLIARD, Master Walter John"	3rd Class Passenger	Southampton		14.5	9	Male	False	
"VAN DE VELDE, Mr Johannes Josef"	3rd Class Passenger	Southampton	Farmer	9.5	35	Male	False	
"VAN DEN STEEN, Mr Leo Peter"	3rd Class Passenger	Southampton	Farmer	9.5	28	Male	False	
"VAN IMPE, Mr Jean Baptiste"	3rd Class Passenger	Southampton	Farmer	24.15	36	Male	False	
"VAN IMPE, Mrs Rosalie Paula"	3rd Class Passenger	Southampton		24.15	30	Female	False	
"VAN IMPE, Miss Catharina"	3rd Class Passenger	Southampton		24.15	10	Female	False	
"VAN MELCKEBEKE, Mr Philemon"	3rd Class Passenger	Southampton	Farmer	9.5	23	Male	False	
"VANDERCRUYSSEN, Mr Victor"	3rd Class Passenger	Southampton	Farmer	9	46	Male	False	
"VANDERPLANCKE, Mr Julius"	3rd Class Passenger	Southampton	Farmer	18	31	Male	False	
"VANDERPLANCKE, Mrs Emelie Maria"	3rd Class Passenger	Southampton		18	31	Female	False	
"VANDERPLANCKE, Miss Augusta Maria"	3rd Class Passenger	Southampton	Servant	18	18	Female	False	
"VANDERPLANCKE, Mr Leo Edmondus"	3rd Class Passenger	Southampton	Farm Labourer	18	15	Male	False	
"VANDEWALLE, Mr Nestor Cyriel"	3rd Class Passenger	Southampton	Merchant	9.5	28	Male	False	
"VARTANIAN, Mr David"	3rd Class Passenger	Cherbourg		7.225	22	Male	True	
"VENDEL, Mr Olof Edvin"	3rd Class Passenger	Southampton	General Labourer	7.854166667	20	Male	False	
"VESTRöM, Miss Hulda Amanda Adolfina"	3rd Class Passenger	Southampton	Servant	7.854166667	14	Female	False	
"VOVK, Mr Janko"	3rd Class Passenger	Southampton	General Labourer	7.895833333	21	Male	False	
"WAELENS, Mr Achille"	3rd Class Passenger	Southampton	Farm Labourer	9	22	Male	False	
"WARE, Mr Frederick"	3rd Class Passenger	Southampton	Motor Fitter	8.05	34	Male	False	
"WARREN, Mr Charles William"	3rd Class Passenger	Southampton	Bricklayer	7.55	30	Male	False	
"WAZLI, Mr Yousif Ahmed"	3rd Class Passenger	Cherbourg	Farmer	7.225	23	Male	False	
"WEBBER, Mr James"	3rd Class Passenger	Southampton	Miner	8.05	66	Male	False	
"WENNERSTRöM, Mr August"	3rd Class Passenger	Southampton		7.795833333	27	Male	True	
"WIDEGREN, Mr Carl Peter"	3rd Class Passenger	Southampton	General Labourer	7.75	51	Male	False	
"WIKLUND, Mr Karl Johan"	3rd Class Passenger	Southampton	General Labourer	6.495833333	21	Male	False	
"WIKLUND, Mr Jakob Alfred"	3rd Class Passenger	Southampton	General Labourer	6.495833333	18	Male	False	
"WILKES, Mrs Ellen"	3rd Class Passenger	Southampton		7	47	Female	True	
"WILLER, Mr Aaron"	3rd Class Passenger	Cherbourg		8.7125	37	Male	False	
"WILLEY, Mr Edward John"	3rd Class Passenger	Southampton	Farm Labourer	7.55	18	Male	False	
"WILLIAMS, Mr Howard Hugh"	3rd Class Passenger	Southampton	Carman	8.05	28	Male	False	
"WILLIAMS, Mr Leslie"	3rd Class Passenger	Southampton	Pugilist	16.1	28	Male	False	
"WINDELøV, Mr Einar"	3rd Class Passenger	Southampton	Dairy Worker	7.25	21	Male	False	
"WIRZ, Mr Albert"	3rd Class Passenger	Southampton	Farmer	8.6625	27	Male	False	
"WISEMAN, Mr Philippe"	3rd Class Passenger	Southampton	Merchant	7.25	54	Male	False	
"WITTEVRONGEL, Mr Camilius Aloysius"	3rd Class Passenger	Southampton	Farmer	9.5	36	Male	False	
"YASBECK, Mr Antoni"	3rd Class Passenger	Cherbourg	General Labourer	14.45416667	27	Male	False	
"YAZBECK, Mrs Selini"	3rd Class Passenger	Cherbourg		14.45416667	15	Female	True	
"YOUSSEFF (ABI SAAB), Mr Gerios"	3rd Class Passenger	Cherbourg	Shoemaker	7.225	26	Male	False	
"YOUSSIFF (SAM'AAN), Mr Gerios"	3rd Class Passenger	Cherbourg		7.229166667	45	Male	False	
"ZAKARIAN, Mr Ortin"	3rd Class Passenger	Cherbourg	General Labourer	7.225	27	Male	False	
"ZAKARIAN, Mr Mapriededer"	3rd Class Passenger	Cherbourg		7.225	22	Male	False	
"ZENNI, Mr Philip"	3rd Class Passenger	Cherbourg	General Labourer	7.225	22	Male	True	
"ZIMMERMANN, Mr Leo"	3rd Class Passenger	Southampton	Farmer	7.875	29	Male	False	
"ANDERSON, Mr James"	Crew	Southampton	Able Seaman	0	40	Male	True	Deck
"ARCHER, Mr Ernest Edward"	Crew	Southampton	Able Seaman	0	35	Male	True	Deck
"BAILEY, Mr Henry Joseph"	Crew	Southampton	Master-at-arms	0	43	Male	True	Deck
"BOXHALL, Mr Joseph Groves"	Crew	Belfast	4th. Officer	0	28	Male	True	Officer
"BRADLEY, Mr T."	Crew	Southampton	Able Seaman	0	29	Male	False	Deck
"BRICE, Mr Walter Thomas"	Crew	Southampton	Able Seaman	0	42	Male	True	Deck
"BRIGHT, Mr Arthur John"	Crew	Belfast	Quartermaster	0	42	Male	True	Deck
"BULEY, Mr Edward John"	Crew	Southampton	Able Seaman	0	26	Male	True	Deck
"CLENCH, Mr Frederick Charles"	Crew	Southampton	Able Seaman	0	33	Male	True	Deck
"CLENCH, Mr George James"	Crew	Southampton	Able Seaman	0	31	Male	False	Deck
"COUCH, Mr Frank"	Crew	Southampton	Able Seaman	0	28	Male	False	Deck
"DAVIS, Mr Stephen James"	Crew	Southampton	Able Seaman	0	39	Male	False	Deck
"EVANS, Mr Alfred Frank"	Crew	Southampton	Lookout	0	25	Male	True	Deck
"EVANS, Mr Frank Oliver"	Crew	Southampton	Able Seaman	0	27	Male	True	Deck
"FLEET, Mr Frederick"	Crew	Belfast	Lookout	0	24	Male	True	Deck
"FOLEY, Mr John"	Crew	Belfast	Deck storekeeper	0	46	Male	True	Deck
"FORWARD, Mr James"	Crew	Southampton	Able Seaman	0	27	Male	True	Deck
"HAINES, Mr Albert"	Crew	Belfast	Boatswain Mate	0	31	Male	True	Deck
"HARDER, Mr William"	Crew	Southampton	Window Cleaner	0	39	Male	True	Deck
"HEMMING, Mr Samuel Ernest"	Crew	Belfast	Lamp Trimmer	0	43	Male	True	Deck
"HICHENS, Mr Robert"	Crew	Southampton	Quartermaster	0	29	Male	True	Deck
"HOGG, Mr George Alfred"	Crew	Belfast	Lookout	0	29	Male	True	Deck
"HOLMAN, Mr Harry"	Crew	Belfast	Able Seaman	0	28	Male	False	Deck
"HOPKINS, Mr Robert John"	Crew	Southampton	Able Seaman	0	40	Male	True	Deck
"HORSWILL, Mr Albert Edward James"	Crew	Southampton	Able Seaman	0	33	Male	True	Deck
"HUMPHREYS, Mr Sidney James"	Crew	Southampton	Quartermaster	0	48	Male	True	Deck
"HUTCHINSON, Mr John Hall"	Crew	Belfast	Carpenter / Joiner	0	26	Male	False	Deck
"JEWELL, Mr Archie"	Crew	Belfast	Lookout	0	23	Male	True	Deck
"JONES, Mr Thomas William"	Crew	Southampton	Able Seaman	0	32	Male	True	Deck
"KING, Mr Thomas Walter"	Crew	Southampton	Master-at-arms	0	42	Male	False	Deck
"LEE, Mr Reginald Robinson"	Crew	Southampton	Lookout	0	41	Male	True	Deck
"LIGHTOLLER, Mr Charles Herbert"	Crew	Belfast	2nd. Officer	0	38	Male	True	Officer
"LOWE, Mr Harold Godfrey"	Crew	Belfast	5th. Officer	0	29	Male	True	Officer
"LUCAS, Mr William Arthur"	Crew	Southampton	Able Seaman	0	25	Male	True	Deck
"LYONS, Mr William Henry"	Crew	Southampton	Able Seaman	0	25	Male	False	Deck
"MATHERSON, Mr David"	Crew	Southampton	Able Seaman	0	30	Male	False	Deck
"MATHIAS, Mr Montague Vincent"	Crew	Southampton	Mess Steward	0	28	Male	False	Deck
"MAXWELL, Mr John"	Crew	Belfast	Carpenter / Joiner	0	31	Male	False	Deck
"MCCARTHY, Mr William"	Crew	Southampton	Able Seaman	0	47	Male	True	Deck
"MCGOUGH, Mr George Francis 'Paddy'"	Crew	Southampton	Able Seaman	0	36	Male	True	Deck
"MOODY, Mr James Paul"	Crew	Belfast	6th. Officer	0	24	Male	False	Officer
"MOORE, Mr George Alfred"	Crew	Southampton	Able Seaman	0	32	Male	True	Deck
"MURDOCH, Mr William McMaster"	Crew	Belfast	1st. Officer	0	39	Male	False	Officer
"NICHOLS, Mr Alfred William Stanley"	Crew	Belfast	Boatswain	0	47	Male	False	Deck
"O'LOUGHLIN, Dr William Francis Norman"	Crew	Belfast	Surgeon	0	62	Male	False	Deck
"OLLIVER, Mr Alfred John"	Crew	Belfast	Quartermaster	0	27	Male	True	Deck
"OSMAN, Mr Frank"	Crew	Southampton	Able Seaman	0	27	Male	True	Deck
"PASCOE, Mr Charles H."	Crew	Southampton	Able Seaman	0	43	Male	True	Deck
"PERKIS, Mr Walter John"	Crew	Belfast	Quartermaster	0	37	Male	True	Deck
"PETERS, Mr William Chapman"	Crew	Southampton	Able Seaman	0	26	Male	True	Deck
"PITMAN, Mr Herbert John"	Crew	Belfast	3rd. Officer	0	34	Male	True	Officer
"POINGDESTRE, Mr John Thomas"	Crew	Southampton	Able Seaman	0	33	Male	True	Deck
"ROWE, Mr George Thomas"	Crew	Belfast	Quartermaster	0	32	Male	True	Deck
"SAWYER, Mr Robert James"	Crew	Southampton	Window Cleaner	0	31	Male	False	Deck
"SCARROTT, Mr Joseph George"	Crew	Southampton	Able Seaman	0	33	Male	True	Deck
"SIMPSON, Dr John Edward"	Crew	Southampton	Assistant Surgeon	0	37	Male	False	Deck
"SMITH, Captain Edward John"	Crew	Southampton	Master	0	62	Male	False	Officer
"SMITH, Mr William"	Crew	Southampton	Seaman	0	26	Male	False	Deck
"SYMONS, Mr George Thomas Macdonald"	Crew	Southampton	Lookout	0	24	Male	True	Deck
"TAMLYN, Mr Frederick"	Crew	Southampton	Mess Steward (Deck Dept.)	0	23	Male	False	Deck
"TAYLOR, Mr Charles William Frederick"	Crew	Southampton	Able-bodied Seaman	0	35	Male	False	Deck
"TERRELL, Mr Bertram"	Crew	Southampton	Seaman	0	18	Male	False	Deck
"VIGOTT, Mr Philip Francis"	Crew	Southampton	Able Seaman	0	32	Male	True	Deck
"WELLER, Mr William Clifford"	Crew	Belfast	Able-bodied Seaman	0	30	Male	True	Deck
"WILDE, Mr Henry Tingle"	Crew	Southampton	Chief Officer	0	39	Male	False	Officer
"WYNN, Mr Walter"	Crew	Belfast	Quartermaster	0	41	Male	True	Deck
"ABRAMS, Mr William Thomas"	Crew	Southampton	Fireman	0	33	Male	False	Engineering
"ADAMS, Mr Robert John"	Crew	Southampton	Fireman	0	26	Male	False	Engineering
"ALLEN, Mr Henry"	Crew	Southampton	Fireman	0	32	Male	False	Engineering
"ALLEN, Mr Ernest Frederick"	Crew	Southampton	Trimmer	0	24	Male	True	Engineering
"ALLSOP, Mr Alfred Samuel"	Crew	Belfast	2nd Electrician	0	35	Male	False	Engineering
"AVERY, Mr James Albert"	Crew	Southampton	Trimmer	0	22	Male	True	Engineering
"BAILEY, Mr George Frank"	Crew	Southampton	Fireman	0	46	Male	False	Engineering
"BAINES, Mr Richard"	Crew	Southampton	Greaser	0	24	Male	False	Engineering
"BANNON, Mr John Joseph"	Crew	Southampton	Greaser	0	34	Male	False	Engineering
"BARLOW, Mr Charles"	Crew	Southampton	Fireman	0	30	Male	False	Engineering
"BARNES, Mr Charles"	Crew	Southampton	Fireman	0	29	Male	False	Engineering
"BARNES, Mr John"	Crew	Southampton	Fireman	0	41	Male	False	Engineering
"BARRETT, Mr Frederick"	Crew	Southampton	Leading Fireman	0	28	Male	True	Engineering
"BARRETT, Mr Frederick William"	Crew	Southampton	Fireman	0	33	Male	False	Engineering
"BEATTIE, Mr Joseph"	Crew	Belfast	Greaser	0	35	Male	False	Engineering
"BEAUCHAMP, Mr George William"	Crew	Southampton	Fireman	0	24	Male	True	Engineering
"BELL, Mr Joseph"	Crew	Belfast	Chief Engineer	0	50	Male	False	Engineering
"BENDELL, Mr Frank"	Crew	Southampton	Fireman	0	24	Male	False	Engineering
"BENNETT, Mr George Alfred"	Crew	Southampton	Fireman	0	30	Male	False	Engineering
"BENVILLE, Mr Edward"	Crew	Southampton	Fireman	0	47	Male	False	Engineering
"BESSANT, Mr William Edward Lowe"	Crew	Southampton	Fireman	0	39	Male	False	Engineering
"BEVIS, Mr Joseph Henry"	Crew	Southampton	Trimmer	0	22	Male	False	Engineering
"BIDDLECOMBE, Mr Reginald Charles"	Crew	Southampton	Fireman	0	31	Male	False	Engineering
"BIGGS, Mr Edward Charles"	Crew	Southampton	Fireman	0	20	Male	False	Engineering
"BILLOWS, Mr James"	Crew	Southampton	Trimmer	0	20	Male	False	Engineering
"BINSTEAD, Mr Walter William"	Crew	Southampton	Trimmer	0	20	Male	True	Engineering
"BLACK, Mr Alexander"	Crew	Southampton	Fireman	0	28	Male	False	Engineering
"BLACK, Mr D."	Crew	Southampton	Fireman	0	41	Male	False	Engineering
"BLACKMAN, Mr Albert Edward"	Crew	Southampton	Fireman	0	23	Male	False	Engineering
"BLAKE, Mr Percival Albert"	Crew	Southampton	Trimmer	0	22	Male	True	Engineering
"BLAKE, Mr Seaton"	Crew	Belfast	Mess Steward	0	26	Male	False	Engineering
"BLAKE, Mr Thomas Henry"	Crew	Southampton	Fireman	0	36	Male	False	Engineering
"BLANEY, Mr James"	Crew	Southampton	Fireman	0	32	Male	False	Engineering
"BLANN, Mr Eustace Horatius"	Crew	Southampton	Fireman	0	21	Male	False	Engineering
"BOTT, Mr William Thomas"	Crew	Southampton	Greaser	0	44	Male	False	Engineering
"BRADLEY, Mr Patrick Joseph"	Crew	Southampton	Fireman	0	39	Male	False	Engineering
"BREWER, Mr Harry"	Crew	Southampton	Trimmer	0	30	Male	False	Engineering
"BRIANT, Mr Albert"	Crew	Southampton	Greaser	0	34	Male	False	Engineering
"BROOKS, Mr J."	Crew	Southampton	Trimmer	0	25	Male	False	Engineering
"BROWN, Mr John"	Crew	Southampton	Fireman	0	25	Male	False	Engineering
"BROWN, Mr Joseph James"	Crew	Southampton	Fireman	0	25	Male	False	Engineering
"BURROUGHS, Mr Arthur Peckham"	Crew	Southampton	Fireman	0	35	Male	False	Engineering
"BURTON, Mr Edward John"	Crew	Southampton	Fireman	0	35	Male	False	Engineering
"BUTT, Mr William John"	Crew	Southampton	Fireman	0	30	Male	False	Engineering
"CALDERWOOD, Mr Hugh"	Crew	Belfast	Trimmer	0	30	Male	False	Engineering
"CANNER, Mr John"	Crew	Southampton	Fireman	0	39	Male	False	Engineering
"CARR, Mr Richard Stephen"	Crew	Southampton	Trimmer	0	37	Male	False	Engineering
"CARTER (BALL), Mr James (W.)"	Crew	Southampton	Fireman	0	46	Male	False	Engineering
"CASEY, Mr Thomas"	Crew	Southampton	Trimmer	0	28	Male	False	Engineering
"CASTLEMAN, Mr Edward"	Crew	Southampton	Greaser	0	37	Male	False	Engineering
"CAVELL, Mr George Henry"	Crew	Southampton	Trimmer	0	22	Male	True	Engineering
"CHERRETT, Mr William Victor"	Crew	Southampton	Fireman	0	24	Male	False	Engineering
"CHISNALL, Mr George Alexander"	Crew	Belfast	Boilermaker	0	36	Male	False	Engineering
"CHORLEY, Mr John Henry"	Crew	Southampton	Fireman	0	25	Male	False	Engineering
"CLARK, Mr William"	Crew	Southampton	Fireman	0	39	Male	True	Engineering
"COE, Mr Harry"	Crew	Southampton	Trimmer	0	21	Male	False	Engineering
"COLEMAN, Mr John"	Crew	Belfast	Engineers' Mess steward	0	57	Male	False	Engineering
"COLLINS, Mr John"	Crew	Southampton	Fireman	0	38	Male	True	Engineering
"COMBES, Mr George"	Crew	Southampton	Fireman	0	34	Male	True	Engineering
"COOPER, Mr Harry"	Crew	Southampton	Fireman	0	26	Male	False	Engineering
"COOPER, Mr James Edward"	Crew	Southampton	Trimmer	0	25	Male	False	Engineering
"COPPERTHWAITE, Mr Albert Harry"	Crew	Southampton	Fireman	0	22	Male	False	Engineering
"CORCORAN, Mr Denny"	Crew	Southampton	Fireman	0	33	Male	False	Engineering
"COTTON, Mr Alfred"	Crew	Southampton	Trimmer	0	35	Male	False	Engineering
"COUCH, Mr Joseph Henry"	Crew	Southampton	Greaser	0	49	Male	False	Engineering
"COUPER, Mr Robert Frederick William"	Crew	Southampton	Fireman	0	29	Male	True	Engineering
"COY, Mr Francis Ernest George"	Crew	Belfast	Junior Assistant 3rd. Engineer	0	26	Male	False	Engineering
"CRABB, Mr Henry James"	Crew	Southampton	Trimmer	0	23	Male	False	Engineering
"CREESE, Mr Henry Philip"	Crew	Belfast	Deck Engineer	0	44	Male	False	Engineering
"CRIMMINS, Mr James"	Crew	Southampton	Fireman	0	21	Male	True	Engineering
"CROSS, Mr William Alfred"	Crew	Southampton	Fireman	0	43	Male	False	Engineering
"CUNNINGHAM, Mr B."	Crew	Southampton	Fireman	0	30	Male	False	Engineering
"CURTIS, Mr Arthur"	Crew	Southampton	Fireman	0	25	Male	False	Engineering
"DAVIES, Mr Thomas"	Crew	Southampton	Leading Fireman	0	33	Male	False	Engineering
"DAWSON, Mr Joseph"	Crew	Southampton	Trimmer	0	23	Male	False	Engineering
"DIAPER, Mr John Joseph"	Crew	Southampton	Fireman	0	27	Male	True	Engineering
"DICKSON, Mr William"	Crew	Southampton	Trimmer	0	36	Male	False	Engineering
"DILLEY, Mr John"	Crew	Southampton	Fireman	0	30	Male	True	Engineering
"DILLON, Mr Thomas Patrick"	Crew	Southampton	Trimmer	0	24	Male	True	Engineering
"DODD, Mr Edward Charles"	Crew	Belfast	Junior 3rd. Engineer	0	38	Male	False	Engineering
"DODDS, Mr Henry Watson"	Crew	Southampton	Junior Assistant 4th Engineer	0	27	Male	False	Engineering
"DOEL, Mr Frederick"	Crew	Southampton	Fireman	0	22	Male	True	Engineering
"DORE, Mr Albert James"	Crew	Southampton	Trimmer	0	22	Male	True	Engineering
"DOYLE, Mr Laurence"	Crew	Southampton	Fireman	0	27	Male	False	Engineering
"DUFFY, Mr William Luke"	Crew	Belfast	Writer / Engineer's Clerk	0	36	Male	False	Engineering
"DURNIL, Mr James"	Crew	Southampton	Leading Fireman	0	38	Male	False	Engineering
"DYER, Mr Henry Ryland"	Crew	Belfast	Senior Assistant 4th. Engineer	0	24	Male	False	Engineering
"DYMOND, Mr Frank"	Crew	Southampton	Fireman	0	40	Male	True	Engineering
"EAGLE, Mr Alfred James"	Crew	Southampton	Trimmer	0	22	Male	False	Engineering
"EASTMAN, Mr Charles"	Crew	Southampton	Greaser	0	44	Male	False	Engineering
"ELLIOTT, Mr Everett Edward"	Crew	Southampton	Trimmer	0	24	Male	False	Engineering
"ERVINE, Mr Albert George"	Crew	Belfast	Assistant Electrician	0	18	Male	False	Engineering
"EVANS, Mr William Thomas"	Crew	Southampton	Trimmer	0	33	Male	False	Engineering
"FARQUHARSON, Mr William Edward"	Crew	Belfast	Senior 2nd. Engineer	0	39	Male	False	Engineering
"FAY, Mr Thomas Joseph"	Crew	Southampton	Greaser	0	30	Male	False	Engineering
"FERRARY, Mr Antonio"	Crew	Southampton	Trimmer	0	34	Male	False	Engineering
"FERRIS, Mr William"	Crew	Southampton	Leading Fireman	0	38	Male	False	Engineering
"FITZPATRICK, Mr Hugh Joseph"	Crew	Belfast	Junior Boilermaker	0	28	Male	False	Engineering
"FITZPATRICK, Mr Cecil William"	Crew	Southampton	Mess Steward	0	21	Male	True	Engineering
"FLARTY, Mr Edward"	Crew	Southampton	Fireman	0	43	Male	True	Engineering
"FORD, Mr H."	Crew	Southampton	Trimmer	0	22	Male	False	Engineering
"FORD, Mr Thomas"	Crew	Southampton	Leading Fireman	0	32	Male	False	Engineering
"FOSTER, Mr Alfred Charles"	Crew	Belfast	Storekeeper (Engineering)	0	37	Male	False	Engineering
"FRASER, Mr James"	Crew	Belfast	Junior Assistant 3rd. Engineer	0	29	Male	False	Engineering
"FRASER, Mr J."	Crew	Southampton	Fireman	0	30	Male	False	Engineering
"FREDERICKS, Mr Walter Francis"	Crew	Southampton	Trimmer	0	21	Male	True	Engineering
"FRYER, Mr Albert Ernest"	Crew	Southampton	Trimmer	0	29	Male	True	Engineering
"GEER, Mr Alfred Emest"	Crew	Southampton	Fireman	0	26	Male	False	Engineering
"GODLEY, Mr George Auguste"	Crew	Southampton	Fireman	0	38	Male	True	Engineering
"GODWIN, Mr Frederick Charles"	Crew	Southampton	Greaser	0	35	Male	False	Engineering
"GOLDER, Mr M. W."	Crew	Southampton	Fireman	0	32	Male	False	Engineering
"GORDON, Mr J."	Crew	Southampton	Trimmer	0	29	Male	False	Engineering
"GOREE, Mr Frank"	Crew	Southampton	Greaser	0	40	Male	False	Engineering
"GOSLING, Mr Bertram James"	Crew	Southampton	Trimmer	0	22	Male	False	Engineering
"GOSLING, Mr S."	Crew	Southampton	Trimmer	0	26	Male	False	Engineering
"GRADIDGE, Mr Ernest Edward"	Crew	Southampton	Fireman	0	22	Male	False	Engineering
"GRAHAM, Mr Thomas G."	Crew	Belfast	Fireman	0	28	Male	True	Engineering
"GREEN, Mr George"	Crew	Southampton	Trimmer	0	20	Male	False	Engineering
"GREGORY, Mr David"	Crew	Southampton	Greaser	0	43	Male	False	Engineering
"GUMERY, Mr George"	Crew	Southampton	Mess Steward	0	24	Male	False	Engineering
"HAGGAN, Mr John"	Crew	Belfast	Fireman	0	35	Male	True	Engineering
"HALL, Mr J."	Crew	Southampton	Fireman	0	32	Male	False	Engineering
"HALLETT, Mr George Alexander"	Crew	Southampton	Fireman	0	22	Male	False	Engineering
"HANDS, Mr Bernard"	Crew	Southampton	Fireman	0	53	Male	False	Engineering
"HANNAM, Mr George"	Crew	Southampton	Fireman	0	29	Male	False	Engineering
"HARRIS, Mr Amos"	Crew	Southampton	Trimmer	0	23	Male	False	Engineering
"HARRIS, Mr Edward John"	Crew	Southampton	Fireman	0	28	Male	False	Engineering
"HARRIS, Mr Frederick"	Crew	Southampton	Fireman	0	39	Male	True	Engineering
"HARRISON, Mr Norman E."	Crew	Belfast	Junior 2nd. Engineer	0	38	Male	False	Engineering
"HART, Mr James"	Crew	Southampton	Fireman	0	49	Male	False	Engineering
"HARVEY, Mr Herbert Gifford"	Crew	Belfast	Junior Assistant 2nd. Engineer	0	34	Male	False	Engineering
"HEAD, Mr Alfred"	Crew	Southampton	Fireman	0	24	Male	False	Engineering
"HEBB, Mr William Albert"	Crew	Southampton	Trimmer	0	22	Male	True	Engineering
"HENDRICKSON, Mr Charles Osker"	Crew	Southampton	Leading Fireman	0	28	Male	True	Engineering
"HESKETH, Mr John Henry"	Crew	Belfast	Second Engineer (refrigeration)	0	33	Male	False	Engineering
"HESLIN, Mr James"	Crew	Southampton	Trimmer	0	45	Male	False	Engineering
"HILL, Mr James"	Crew	Southampton	Trimmer	0	25	Male	False	Engineering
"HINTON, Mr Stephen William"	Crew	Southampton	Trimmer	0	30	Male	False	Engineering
"HODGE, Mr Charley"	Crew	Belfast	Senior Assistant 3rd. Engineer	0	29	Male	False	Engineering
"HODGES, Mr W."	Crew	Southampton	Fireman	0	26	Male	False	Engineering
"HODGKINSON, Mr Leonard"	Crew	Belfast	Senior 4th. Engineer	0	46	Male	False	Engineering
"HOPGOOD, Mr Roland John C."	Crew	Southampton	Fireman	0	28	Male	False	Engineering
"HOSGOOD, Mr Richard William"	Crew	Southampton	Fireman	0	22	Male	False	Engineering
"HOSKING, Mr George Fox"	Crew	Belfast	Senior 3rd. Engineer	0	36	Male	False	Engineering
"HUNT, Mr Albert Sylvanus"	Crew	Southampton	Trimmer	0	23	Male	True	Engineering
"HUNT, Mr Tom"	Crew	Southampton	Fireman	0	27	Male	False	Engineering
"HURST, Mr Charles John"	Crew	Southampton	Fireman	0	35	Male	False	Engineering
"HURST, Mr Walter"	Crew	Southampton	Fireman	0	23	Male	True	Engineering
"INGRAM, Mr George"	Crew	Southampton	Trimmer	0	20	Male	False	Engineering
"INSTANCE, Mr T."	Crew	Southampton	Fireman	0	33	Male	False	Engineering
"JACKOPSON, Mr John Henry"	Crew	Southampton	Fireman	0	30	Male	False	Engineering
"JAGO, Mr Joseph"	Crew	Southampton	Greaser	0	57	Male	False	Engineering
"JAMES, Mr Thomas"	Crew	Southampton	Fireman	0	27	Male	False	Engineering
"JOAS, Mr N."	Crew	Southampton	Fireman	0	38	Male	False	Engineering
"JUDD, Mr Charles Edward"	Crew	Southampton	Fireman	0	31	Male	True	Engineering
"JUKES, Mr Henry James"	Crew	Southampton	Greaser	0	38	Male	False	Engineering
"JUPE, Mr Boykett Herbert"	Crew	Southampton	Electrician	0	30	Male	False	Engineering
"KASPER, Mr F."	Crew	Southampton	Fireman	0	40	Male	True	Engineering
"KEARL, Mr Charles Henry"	Crew	Southampton	Greaser	0	44	Male	False	Engineering
"KEARL, Mr George Edward"	Crew	Southampton	Trimmer	0	24	Male	False	Engineering
"KELLY, Mr James"	Crew	Southampton	Greaser	0	44	Male	False	Engineering
"KELLY, Mr William"	Crew	Belfast	Assistant Electrician	0	23	Male	False	Engineering
"KEMISH, Mr George"	Crew	Southampton	Fireman	0	22	Male	True	Engineering
"KEMP, Mr Thomas Hulman"	Crew	Belfast	Extra Assistant 4th Engineer (Refrigeration)	0	43	Male	False	Engineering
"KENCHENTEN, Mr Frederick Charles"	Crew	Southampton	Greaser	0	36	Male	False	Engineering
"KENZLER, Mr August"	Crew	Belfast	Storekeeper	0	43	Male	False	Engineering
"KERR, Mr Thomas Russell"	Crew	Southampton	Fireman	0	26	Male	False	Engineering
"KINSELLA, Mr Louis"	Crew	Southampton	Fireman	0	30	Male	False	Engineering
"KIRKHAM, Mr James"	Crew	Southampton	Greaser	0	43	Male	False	Engineering
"KNOWLES, Mr Thomas"	Crew	Southampton	Firemens' Messman	0	42	Male	True	Engineering
"LAHY, Mr T. E."	Crew	Southampton	Fireman	0	32	Male	False	Engineering
"LEE, Mr H."	Crew	Southampton	Trimmer	0	18	Male	False	Engineering
"LIGHT, Mr Christopher William"	Crew	Southampton	Fireman	0	20	Male	False	Engineering
"LIGHT, Mr W."	Crew	Southampton	Fireman	0	47	Male	False	Engineering
"LINDSAY, Mr William Charles"	Crew	Southampton	Fireman	0	30	Male	True	Engineering
"LLOYD, Mr William"	Crew	Southampton	Fireman	0	29	Male	False	Engineering
"LONG, Mr Frank"	Crew	Southampton	Trimmer	0	28	Male	False	Engineering
"LONG, Mr William"	Crew	Southampton	Trimmer	0	30	Male	False	Engineering
"MACKIE, Mr William Dickson"	Crew	Belfast	Junior 5th. Engineer	0	32	Male	False	Engineering
"MAJOR, Mr William James"	Crew	Southampton	Fireman	0	32	Male	True	Engineering
"MARETT, Mr George John"	Crew	Southampton	Fireman	0	27	Male	False	Engineering
"MARSH, Mr Frederick Charles"	Crew	Southampton	Fireman	0	39	Male	False	Engineering
"MASKELL, Mr Leopold Adolphus"	Crew	Southampton	Trimmer	0	25	Male	False	Engineering
"MASON, Mr Frank Archibald Robert"	Crew	Southampton	Fireman	0	32	Male	True	Engineering
"MASON, Mr J."	Crew	Southampton	Leading Fireman	0	39	Male	False	Engineering
"MAY, Mr Arthur William"	Crew	Southampton	Fireman	0	24	Male	False	Engineering
"MAY, Mr Arthur William"	Crew	Southampton	Fireman Messman	0	59	Male	False	Engineering
"MAYO, Mr William Peter"	Crew	Southampton	Leading Fireman	0	27	Male	False	Engineering
"MAYZES, Mr Thomas Jubilee"	Crew	Southampton	Fireman	0	25	Male	True	Engineering
"MCANDREW, Mr Thomas Patrick"	Crew	Southampton	Fireman	0	38	Male	False	Engineering
"MCANDREWS, Mr William"	Crew	Southampton	Fireman	0	23	Male	False	Engineering
"MCCASTLAN, Mr W."	Crew	Southampton	Fireman	0	38	Male	False	Engineering
"MCGANN, Mr James"	Crew	Southampton	Trimmer	0	26	Male	True	Engineering
"MCGARVEY, Mr Edward Joseph"	Crew	Southampton	Fireman	0	34	Male	False	Engineering
"MCGAW, Mr Erroll Victor"	Crew	Southampton	Fireman	0	30	Male	False	Engineering
"MCINERNEY, Mr Thomas"	Crew	Southampton	Greaser	0	38	Male	False	Engineering
"MCINTYRE, Mr William"	Crew	Southampton	Trimmer	0	21	Male	True	Engineering
"MCQUILLAN, Mr William"	Crew	Belfast	Fireman	0	26	Male	False	Engineering
"MCRAE, Mr William Alexander"	Crew	Southampton	Fireman	0	31	Male	False	Engineering
"MCREYNOLDS, Mr William"	Crew	Belfast	Junior 6th. Engineer	0	22	Male	False	Engineering
"MIDDLETON, Mr Alfred Pirrie"	Crew	Belfast	Assistant Electrician	0	26	Male	False	Engineering
"MILFORD, Mr George"	Crew	Southampton	Fireman	0	27	Male	False	Engineering
"MILLAR, Mr Robert"	Crew	Belfast	Extra 5th Engineer	0	26	Male	False	Engineering
"MILLAR, Mr Thomas"	Crew	Belfast	Deck Engineer	0	32	Male	False	Engineering
"MINTRAM, Mr William"	Crew	Southampton	Fireman	0	46	Male	False	Engineering
"MITCHELL, Mr Lorenzo (Lawrence) Horace"	Crew	Southampton	Trimmer	0	18	Male	False	Engineering
"MOORE, Mr John J."	Crew	Southampton	Fireman	0	29	Male	True	Engineering
"MOORE, Mr Ralph"	Crew	Southampton	Trimmer	0	21	Male	False	Engineering
"MOORES, Mr Richard Henry"	Crew	Southampton	Greaser	0	44	Male	False	Engineering
"MORGAN, Mr Arthur Herbert"	Crew	Southampton	Trimmer	0	27	Male	False	Engineering
"MORGAN, Mr Thomas A."	Crew	Southampton	Fireman	0	26	Male	False	Engineering
"MORRIS, Mr Arthur"	Crew	Southampton	Greaser	0	30	Male	False	Engineering
"MORRIS, Mr William Edward"	Crew	Southampton	Trimmer	0	22	Male	False	Engineering
"MOYES, Mr William Young"	Crew	Belfast	Senior 6th. Engineer	0	23	Male	False	Engineering
"NETTLETON, Mr George Walter"	Crew	Southampton	Fireman	0	29	Male	False	Engineering
"NEWMAN, Mr Charles Thomas"	Crew	Southampton	Assistant Storekeeper	0	33	Male	False	Engineering
"NIVEN, Mr John Brown"	Crew	Southampton	Fireman	0	30	Male	False	Engineering
"NOON, Mr John"	Crew	Southampton	Fireman	0	35	Male	False	Engineering
"NORRIS, Mr James"	Crew	Southampton	Fireman	0	23	Male	False	Engineering
"NOSS, Mr Bertram Arthur"	Crew	Southampton	Fireman	0	21	Male	False	Engineering
"NOSS, Mr Henry"	Crew	Southampton	Fireman	0	30	Male	True	Engineering
"NUTBEAN, Mr William"	Crew	Southampton	Fireman	0	30	Male	True	Engineering
"O'CONNOR, Mr John"	Crew	Southampton	Trimmer	0	25	Male	True	Engineering
"OLIVE, Mr Charles"	Crew	Southampton	Greaser	0	31	Male	False	Engineering
"OLIVER, Mr H."	Crew	Southampton	Fireman	0	32	Male	True	Engineering
"OTHEN, Mr Charles Alfred"	Crew	Southampton	Fireman	0	36	Male	True	Engineering
"PAICE, Mr Richard Charles John"	Crew	Southampton	Fireman	0	32	Male	False	Engineering
"PAINTER, Mr Charles"	Crew	Southampton	Fireman	0	31	Male	False	Engineering
"PAINTER, Mr Frank Frederick"	Crew	Southampton	Fireman	0	29	Male	False	Engineering
"PALLES, Mr Thomas Henry Michael"	Crew	Belfast	Greaser	0	42	Male	False	Engineering
"PARSONS, Mr Frank Alfred"	Crew	Belfast	Senior 5th. Engineer	0	26	Male	False	Engineering
"PEARCE, Mr John"	Crew	Southampton	Fireman	0	28	Male	True	Engineering
"PELHAM, Mr George"	Crew	Southampton	Trimmer	0	39	Male	True	Engineering
"PERRY, Mr Edgar Lionel"	Crew	Southampton	Trimmer	0	19	Male	True	Engineering
"PERRY, Mr Henry Frederick"	Crew	Southampton	Trimmer	0	23	Male	False	Engineering
"PHILLIPS, Mr A. George"	Crew	Southampton	Greaser	0	27	Male	False	Engineering
"PITFIELD, Mr William James"	Crew	Southampton	Greaser	0	25	Male	False	Engineering
"PODESTA, Mr Alfred John Alexander"	Crew	Southampton	Fireman	0	24	Male	True	Engineering
"POND, Mr George"	Crew	Southampton	Fireman	0	32	Male	False	Engineering
"PRANGNELL, Mr George Alexander"	Crew	Southampton	Greaser	0	30	Male	True	Engineering
"PRESTON, Mr Thomas Charles Alfred"	Crew	Southampton	Trimmer	0	20	Male	False	Engineering
"PRIEST, Mr Arthur John"	Crew	Southampton	Fireman	0	24	Male	True	Engineering
"PROUDFOOT, Mr Richard Royston"	Crew	Southampton	Trimmer	0	23	Male	False	Engineering
"PUGH, Mr Arthur Percy"	Crew	Southampton	Leading Fireman	0	31	Male	False	Engineering
"PUSEY, Mr William Robert Holland"	Crew	Southampton	Fireman	0	22	Male	True	Engineering
"RANGER, Mr Thomas"	Crew	Southampton	Greaser	0	29	Male	True	Engineering
"READ, Mr Joseph"	Crew	Southampton	Trimmer	0	21	Male	False	Engineering
"REEVES, Mr Frederick Simms"	Crew	Southampton	Fireman	0	33	Male	False	Engineering
"REID, Mr Robert Thomas"	Crew	Southampton	Trimmer	0	30	Male	False	Engineering
"RICE, Mr Charles"	Crew	Southampton	Fireman	0	32	Male	True	Engineering
"RICHARDS, Mr Joseph James"	Crew	Southampton	Fireman	0	28	Male	False	Engineering
"RICKMAN, Mr George Albert"	Crew	Southampton	Fireman	0	36	Male	False	Engineering
"ROBERTS, Mr Robert George"	Crew	Southampton	Fireman	0	35	Male	False	Engineering
"ROUS, Mr Arthur John"	Crew	Belfast	Plumber	0	26	Male	False	Engineering
"RUDD, Mr Henry"	Crew	Southampton	Engineers' storekeeper	0	23	Male	False	Engineering
"RUTTER, Mr Sidney Frank"	Crew	Southampton	Fireman	0	26	Male	False	Engineering
"SANGSTER, Mr Charles Edward"	Crew	Southampton	Fireman	0	32	Male	False	Engineering
"SAUNDERS, Mr F."	Crew	Southampton	Fireman	0	22	Male	False	Engineering
"SAUNDERS, Mr Walter Ernest"	Crew	Southampton	Trimmer	0	23	Male	False	Engineering
"SAUNDERS, Mr W."	Crew	Southampton	Fireman	0	23	Male	False	Engineering
"SCOTT, Mr Frederick William"	Crew	Southampton	Greaser	0	28	Male	True	Engineering
"SCOTT, Mr Archibald"	Crew	Southampton	Fireman	0	41	Male	False	Engineering
"SELF, Mr Alfred Henry"	Crew	Southampton	Greaser	0	39	Male	False	Engineering
"SELF, Mr Albert Charles Edward"	Crew	Southampton	Fireman	0	24	Male	True	Engineering
"SENIOR, Mr Harry"	Crew	Southampton	Fireman	0	31	Male	True	Engineering
"SHEA, Mr Thomas"	Crew	Southampton	Fireman	0	32	Male	False	Engineering
"SHEATH, Mr Frederick"	Crew	Southampton	Trimmer	0	20	Male	True	Engineering
"SHEPHERD, Mr Jonathan"	Crew	Southampton	Junior Assistant 2nd. Engineer	0	32	Male	False	Engineering
"SHIERS, Mr Alfred Charles"	Crew	Southampton	Fireman	0	25	Male	True	Engineering
"SHILLABEER, Mr Charles Frederick"	Crew	Southampton	Trimmer	0	19	Male	False	Engineering
"SKEATES, Mr William"	Crew	Southampton	Trimmer	0	23	Male	False	Engineering
"SLOAN, Mr Peter"	Crew	Belfast	Chief Electrician	0	31	Male	False	Engineering
"SMALL, Mr William"	Crew	Southampton	Leading Fireman	0	40	Male	False	Engineering
"SMITH, Mr Emest George"	Crew	Southampton	Trimmer	0	27	Male	False	Engineering
"SMITH, Mr James Muil"	Crew	Belfast	Junior 4th. Engineer	0	39	Male	False	Engineering
"SMITHER, Mr Harry James"	Crew	Southampton	Fireman	0	22	Male	False	Engineering
"SNELLGROVE, Mr George"	Crew	Southampton	Fireman	0	40	Male	False	Engineering
"SNOOKS, Mr W."	Crew	Southampton	Trimmer	0	26	Male	False	Engineering
"SNOW, Mr Eustace Philip"	Crew	Southampton	Trimmer	0	21	Male	True	Engineering
"SPARKMAN, Mr Henry William"	Crew	Southampton	Fireman	0	35	Male	True	Engineering
"STANBROOK, Mr Augustus George"	Crew	Southampton	Fireman	0	30	Male	False	Engineering
"STEEL, Mr Robert Edward"	Crew	Southampton	Trimmer	0	29	Male	False	Engineering
"STOCKER, Mr Henry Dorey"	Crew	Southampton	Trimmer	0	20	Male	False	Engineering
"STREET, Mr Thomas Albert"	Crew	Southampton	Fireman	0	25	Male	True	Engineering
"STUBBS, Mr James Henry"	Crew	Southampton	Fireman	0	28	Male	False	Engineering
"SULLIVAN, Mr S."	Crew	Southampton	Fireman	0	25	Male	False	Engineering
"TAYLOR, Mr J."	Crew	Southampton	Fireman	0	42	Male	False	Engineering
"TAYLOR, Mr George"	Crew	Southampton	Fireman	0	24	Male	True	Engineering
"TAYLOR, Mr John Henry"	Crew	Southampton	Fireman	0	49	Male	False	Engineering
"TAYLOR, Mr William Henry"	Crew	Southampton	Fireman	0	27	Male	True	Engineering
"THOMAS, Mr Joseph Wakefield"	Crew	Southampton	Fireman	0	25	Male	False	Engineering
"THOMPSON, Mr John William"	Crew	Southampton	Fireman	0	35	Male	True	Engineering
"THRELFALL, Mr Thomas"	Crew	Southampton	Leading Fireman	0	44	Male	True	Engineering
"THRESHER, Mr George Terrill"	Crew	Southampton	Fireman	0	25	Male	True	Engineering
"TIZARD, Mr Arthur Leopold"	Crew	Southampton	Fireman	0	31	Male	False	Engineering
"TOZER, Mr James"	Crew	Southampton	Greaser	0	30	Male	False	Engineering
"TRIGGS, Mr Robert"	Crew	Southampton	Fireman	0	40	Male	True	Engineering
"TURLEY, Mr Richard"	Crew	Belfast	Fireman	0	36	Male	False	Engineering
"VAN DER BRUGGE, Mr Wessel Adrianus"	Crew	Southampton	Fireman	0	38	Male	False	Engineering
"VEAL, Mr Arthur"	Crew	Southampton	Greaser	0	36	Male	False	Engineering
"VEAR, Mr Henry"	Crew	Southampton	Fireman	0	32	Male	False	Engineering
"VEAR, Mr William"	Crew	Southampton	Fireman	0	33	Male	False	Engineering
"WARD, Mr Arthur"	Crew	Belfast	Junior Assistant 4th. Engineer	0	24	Male	False	Engineering
"WARD, Mr James William"	Crew	Southampton	Leading Fireman	0	31	Male	False	Engineering
"WARDNER, Mr Fred Albert"	Crew	Southampton	Fireman	0	39	Male	False	Engineering
"WATERIDGE, Mr Edward Lewis"	Crew	Southampton	Fireman	0	25	Male	False	Engineering
"WATSON, Mr W."	Crew	Southampton	Fireman	0	27	Male	False	Engineering
"WATTS, Mr"	Crew	Southampton	Trimmer	0	36	Male	False	Engineering
"WEBB, Mr Samuel Francis"	Crew	Southampton	Trimmer	0	28	Male	False	Engineering
"WEBBER, Mr Francis Albert"	Crew	Southampton	Leading Fireman	0	31	Male	False	Engineering
"WHITE, Mr Albert"	Crew	Southampton	Trimmer	0	21	Male	False	Engineering
"WHITE, Mr Alfred"	Crew	Southampton	Greaser	0	32	Male	True	Engineering
"WHITE, Mr Frank Leonard"	Crew	Southampton	Trimmer	0	28	Male	False	Engineering
"WHITE, Mr William George"	Crew	Southampton	Trimmer	0	23	Male	True	Engineering
"WILLIAMS, Mr Samuel Solomon"	Crew	Southampton	Fireman	0	26	Male	False	Engineering
"WILSON, Mr Herbert 'Bertie'"	Crew	Belfast	Senior Assistant 2nd Engineer	0	28	Male	False	Engineering
"WILTON, Mr William Edward"	Crew	Southampton	Trimmer	0	53	Male	False	Engineering
"WITCHER, Mr Albert Ernest"	Crew	Southampton	Fireman	0	39	Male	False	Engineering
"WITT, Mr Henry Dennis"	Crew	Southampton	Fireman	0	37	Male	False	Engineering
"WOOD, Mr Henry"	Crew	Southampton	Trimmer	0	30	Male	False	Engineering
"WOODFORD, Mr Frederick Ernest"	Crew	Southampton	Greaser	0	40	Male	False	Engineering
"WORTHMAN, Mr William Henry"	Crew	Southampton	Fireman	0	37	Male	False	Engineering
"WYETH, Mr James Robert"	Crew	Southampton	Fireman	0	26	Male	False	Engineering
"YOUNG, Mr Francis James"	Crew	Southampton	Fireman	0	32	Male	False	Engineering
"ABBOTT, Mr Ernest Owen"	Crew	Southampton	Lounge Pantry Steward	0	21	Male	False	Victualling
"AHIER, Mr Percy Snowden"	Crew	Southampton	Saloon Steward	0	20	Male	False	Victualling
"AKERMAN, Mr Albert Edward"	Crew	Southampton	3rd Class Steward	0	31	Male	False	Victualling
"AKERMAN, Mr Joseph Francis"	Crew	Southampton	Assistant Pantryman Steward	0	35	Male	False	Victualling
"ALLEN, Mr George"	Crew	Southampton	Scullion	0	26	Male	False	Victualling
"ALLEN, Mr Robert Spencer"	Crew	Southampton	Bedroom Steward (1st Class)	0	36	Male	False	Victualling
"ALLEN, Mr Frederick"	Crew	Southampton	Lift Steward	0	17	Male	False	Victualling
"ALLSOP, Mr Frank Richard"	Crew	Belfast	Saloon Steward	0	41	Male	False	Victualling
"ANDERSON, Mr Walter Yuill"	Crew	Southampton	Bed Room Steward	0	48	Male	False	Victualling
"ANDREWS, Mr Charles Edward"	Crew	Southampton	Saloon Steward (2nd class)	0	19	Male	True	Victualling
"ASHCROFT, Mr Austin Aloysius"	Crew	Southampton	Clerk	0	26	Male	False	Victualling
"ASHE, Mr Henry Wellesley"	Crew	Southampton	Glory hole steward (3rd class)	0	41	Male	False	Victualling
"AYLING, Mr Edwin George"	Crew	Southampton	Assistant Vegetable Cook	0	22	Male	False	Victualling
"BACK, Mr Charles Frederick"	Crew	Belfast	Assistant Lounge Steward	0	32	Male	False	Victualling
"BAGGOTT, Mr Allen Marden"	Crew	Southampton	Saloon Steward	0	28	Male	True	Victualling
"BAGLEY, Mr Edward Henry"	Crew	Southampton	Saloon Steward	0	33	Male	False	Victualling
"BAILEY, Mr George Francis"	Crew	Belfast	Saloon Steward	0	36	Male	False	Victualling
"BALL, Mr Percy"	Crew	Southampton	Plate Steward	0	19	Male	True	Victualling
"BARKER, Mr Albert Vale"	Crew	Southampton	Baker	0	19	Male	False	Victualling
"BARKER, Mr Ernest Thomas"	Crew	Southampton	Saloon Steward (1st class)	0	40	Male	False	Victualling
"BARKER, Mr Reginald Lomond"	Crew	Belfast	"Second Purser, 1st Class"	0	40	Male	False	Victualling
"BARLOW, Mr George"	Crew	Southampton	Bed Room Steward	0	36	Male	False	Victualling
"BARNES, Mr Frederick Charles"	Crew	Southampton	Assistant baker	0	39	Male	False	Victualling
"BARRATT, Mr Arthur"	Crew	Southampton	Bell Boy	0	15	Male	False	Victualling
"BARRINGER, Mr Arthur William"	Crew	Belfast	Saloon Steward (1st class)	0	33	Male	False	Victualling
"BARROW, Mr Charles Henry John Barrow"	Crew	Southampton	Assistant butcher	0	35	Male	False	Victualling
"BARROWS, Mr William"	Crew	Southampton	Saloon Steward	0	32	Male	False	Victualling
"BARTON, Mr Sidney John"	Crew	Southampton	3rd Class Steward	0	26	Male	False	Victualling
"BAXTER, Mr Harry Ross"	Crew	Southampton	3rd Class Steward	0	53	Male	False	Victualling
"BAXTER, Mr Thomas Ferguson"	Crew	Southampton	Linen Steward (1st class)	0	55	Male	False	Victualling
"BEDFORD, Mr William Barnett"	Crew	Southampton	Assistant Roast Cook	0	31	Male	False	Victualling
"BEEDEM, Mr George Arthur"	Crew	Southampton	2nd Class Bedroom Steward	0	34	Male	False	Victualling
"BEERE, Mr William"	Crew	Southampton	Kitchen Porter	0	19	Male	False	Victualling
"BENHAM, Mr Fred John"	Crew	Southampton	Saloon Steward (2nd class)	0	29	Male	False	Victualling
"BENNETT, Mrs Mabel"	Crew	Southampton	Stewardess	0	33	Female	True	Victualling
"BESSANT, Mr Edward"	Crew	Southampton	1st class baggage steward	0	31	Male	False	Victualling
"BEST, Mr Edwin Alfred"	Crew	Belfast	Saloon Steward (1st class)	0	38	Male	False	Victualling
"BISHOP, Mr Walter Alexander"	Crew	Belfast	1st Class Bedroom Steward	0	33	Male	False	Victualling
"BLISS, Mrs Emma"	Crew	Southampton	Stewardess	0	45	Female	True	Victualling
"BOCHATAY, Mr Alexis Joseph"	Crew	Southampton	Chef	0	30	Male	False	Victualling
"BOGIE, Mr Norman Leslie"	Crew	Southampton	2nd Class Bedroom Steward	0	59	Male	False	Victualling
"BOND, Mr William John"	Crew	Belfast	Bed Room Steward	0	40	Male	False	Victualling
"BOOTHBY, Mr Walter Thomas"	Crew	Southampton	2nd Class Bedroom Steward	0	37	Male	False	Victualling
"BOSTON, Mr William John"	Crew	Belfast	Assistant Deck Steward (1st Class)	0	31	Male	False	Victualling
"BOUGHTON, Mr Bernard John"	Crew	Southampton	First class saloon steward	0	24	Male	False	Victualling
"BOYD, Mr John"	Crew	Southampton	Saloon Steward (1st class)	0	36	Male	False	Victualling
"BOYES, Mr John Henry"	Crew	Belfast	Saloon Steward (1st class)	0	36	Male	False	Victualling
"BRADSHAW, Mr John Albert Perkin"	Crew	Southampton	Plate Steward (1st Class)	0	43	Male	False	Victualling
"BREWSTER, Mr George Henry"	Crew	Belfast	Bedroom Steward (1st Class)	0	48	Male	False	Victualling
"BRIDE, Mr Harold Sydney"	Crew	Belfast	Assistant Telegraphist	0	22	Male	True	Victualling
"BRISTOW, Mr Robert Charles"	Crew	Southampton	3rd Class Steward	0	31	Male	False	Victualling
"BRISTOW, Mr Harry"	Crew	Southampton	Saloon Steward	0	33	Male	False	Victualling
"BROOKMAN, Mr John Cress"	Crew	Southampton	3rd Class Steward	0	27	Male	False	Victualling
"BROOM, Mr Herbert George"	Crew	Belfast	Bath Steward	0	33	Male	False	Victualling
"BROOME, Mr Athol Frederick"	Crew	Southampton	Verandah Steward (1st Class)	0	30	Male	False	Victualling
"BROWN, Mr Edward"	Crew	Belfast	Saloon Steward	0	34	Male	True	Victualling
"BROWN, Mr Walter James"	Crew	Belfast	Saloon Steward (1st class)	0	40	Male	False	Victualling
"BUCKLEY, Mr H. E."	Crew	Southampton	Assistant Vegetable Cook	0	34	Male	False	Victualling
"BULL, Mr W."	Crew	Southampton	Scullion	0	30	Male	False	Victualling
"BULLEY, Mr Henry Ashburnham"	Crew	Southampton	Boots Steward (2nd class)	0	21	Male	False	Victualling
"BUNNELL, Mr Wilfred James"	Crew	Belfast	Plate Steward	0	20	Male	False	Victualling
"BURGESS, Mr Charles"	Crew	Southampton	Extra 3rd. Baker	0	18	Male	True	Victualling
"BURKE, Mr Richard Edward"	Crew	Belfast	Lounge Steward (1st class)	0	30	Male	False	Victualling
"BURKE, Mr William"	Crew	Belfast	Saloon Steward	0	31	Male	True	Victualling
"BURR, Mr Ewart Sydenham"	Crew	Southampton	Saloon Steward (1st class)	0	29	Male	False	Victualling
"BURRAGE, Mr Arthur Victor Edwards"	Crew	Southampton	Plate Steward	0	20	Male	True	Victualling
"BUTT, Mr Robert Henry"	Crew	Southampton	Saloon Steward	0	21	Male	False	Victualling
"BUTTERWORTH, Mr John"	Crew	Southampton	Saloon Steward	0	23	Male	False	Victualling
"BYRNE, Mr James Edward"	Crew	Southampton	Bedroom Steward (2nd Class)	0	38	Male	False	Victualling
"CAMPBELL, Mr Donald S."	Crew	Southampton	3rd Class Clerk	0	25	Female	False	Victualling
"CARNEY, Mr William"	Crew	Southampton	Lift Steward	0	31	Male	False	Victualling
"CARTWRIGHT, Mr James Edward"	Crew	Belfast	Saloon Steward	0	32	Male	False	Victualling
"CASSWILL, Mr Charles"	Crew	Southampton	Saloon Steward	0	34	Male	False	Victualling
"CATON, Miss Annie"	Crew	Southampton	Turkish Bath Stewardess	0	33	Female	True	Victualling
"CAUNT, Mr William Ewart"	Crew	Southampton	Grill Cook	0	27	Male	False	Victualling
"CAVE, Mr Herbert"	Crew	Belfast	Saloon Steward (1st class)	0	39	Male	False	Victualling
"CECIL, Mr Charles Thomas"	Crew	Southampton	Steward	0	21	Male	False	Victualling
"CHAPMAN, Mr Joseph Charles"	Crew	Southampton	"Boots steward, 2nd class"	0	32	Male	True	Victualling
"CHARMAN, Mr John James"	Crew	Southampton	Saloon Steward (2nd class)	0	25	Male	False	Victualling
"CHEVERTON, Mr William Frederick"	Crew	Belfast	Saloon Steward (1st class)	0	27	Male	False	Victualling
"CHITTY, Mr Archibald George"	Crew	Southampton	Third Class Steward	0	28	Male	False	Victualling
"CHITTY, Mr George Henry"	Crew	Southampton	Baker	0	50	Male	False	Victualling
"CHRISTMAS, Mr Herbert Harry"	Crew	Southampton	Assistant Saloon Steward (2nd class)	0	33	Male	False	Victualling
"COLEMAN, Mr Albert Edward"	Crew	Southampton	Saloon Steward (1st class)	0	28	Male	False	Victualling
"COLGAN, Mr E. Joseph"	Crew	Southampton	Scullion	0	33	Male	True	Victualling
"COLLINS, Mr John"	Crew	Southampton	Scullion	0	17	Male	True	Victualling
"CONWAY, Mr Percy Walter"	Crew	Belfast	Saloon Steward (2nd class)	0	24	Male	False	Victualling
"COOK, Mr George"	Crew	Southampton	Saloon Steward	0	32	Male	False	Victualling
"COOMBS, Mr Charles Augustus"	Crew	Southampton	Assistant Cook	0	44	Male	False	Victualling
"CORBEN, Mr Ernest Theodore"	Crew	Southampton	Assistant Printer Steward	0	27	Male	False	Victualling
"COX, Mr William Denton"	Crew	Southampton	Third class steward	0	29	Male	False	Victualling
"CRAFTER, Mr Frederick Horace"	Crew	Southampton	Saloon Steward (1st class)	0	20	Male	True	Victualling
"CRAWFORD, Mr Alfred George"	Crew	Belfast	Bed Room Steward	0	43	Male	True	Victualling
"CRISP, Mr Albert Hector"	Crew	Belfast	Saloon Steward	0	39	Male	False	Victualling
"CRISPIN, Mr William"	Crew	Southampton	Glory Hole Steward	0	32	Male	False	Victualling
"CROSBIE, Mr John Borthwick"	Crew	Southampton	Turkish Bath Attendant	0	44	Male	False	Victualling
"CROWE, Mr George Frederick"	Crew	Southampton	Saloon Steward	0	30	Male	True	Victualling
"CRUMPLIN, Mr Charles George Chandler"	Crew	Belfast	Bed Room Steward	0	35	Male	False	Victualling
"CULLEN, Mr Charles James"	Crew	Belfast	1st Class Bedroom Steward	0	49	Male	True	Victualling
"CUNNINGHAM, Mr Andrew Orr"	Crew	Belfast	1st Class Bedroom Steward	0	38	Male	True	Victualling
"DANIELS, Mr Sidney Edward"	Crew	Southampton	Third class steward	0	18	Male	True	Victualling
"DASHWOOD, Mr William George"	Crew	Southampton	Saloon Steward (2nd class)	0	18	Male	False	Victualling
"DAVIES, Mr Gordon Raleigh"	Crew	Belfast	1st Class Bedroom Steward	0	32	Male	False	Victualling
"DAVIES, Mr Robert J."	Crew	Belfast	Saloon Steward	0	26	Male	False	Victualling
"DAVIS, Mr John"	Crew	Belfast	Extra 2nd Baker	0	29	Male	False	Victualling
"DEAN, Mr George H."	Crew	Southampton	Assistant Saloon Steward	0	19	Male	False	Victualling
"DEEBLE, Mr Alfred Arnold"	Crew	Belfast	Saloon Steward (1st class)	0	34	Male	False	Victualling
"DERRETT, Mr Arthur Henry"	Crew	Belfast	Saloon Steward (1st class)	0	28	Male	False	Victualling
"DESLANDES, Mr Percival Stainer"	Crew	Southampton	Saloon Steward	0	36	Male	False	Victualling
"DINENAGE, Mr James Richard"	Crew	Southampton	Saloon Steward (1st class)	0	49	Male	False	Victualling
"DODD, Mr George Charles"	Crew	Belfast	"Second Steward, 1st Class"	0	44	Male	False	Victualling
"DOLBY, Mr Joseph"	Crew	Belfast	Reception Steward (1st Class)	0	38	Male	False	Victualling
"DONOGHUE, Mr Frank (?Thomas)"	Crew	Belfast	Bed Room Steward	0	35	Male	False	Victualling
"DOUGHTY, Mr Walter Thomas"	Crew	Southampton	Saloon Steward (2nd class)	0	22	Male	False	Victualling
"DUNFORD, Mr William"	Crew	Southampton	Hospital Steward	0	47	Male	False	Victualling
"DYER, Mr William Henry"	Crew	Southampton	Saloon Steward (1st class)	0	31	Male	False	Victualling
"EDBROOKE, Mr Francis Samuel Jacob"	Crew	Southampton	Third class steward	0	23	Male	False	Victualling
"EDE, Mr George Bulkeley"	Crew	Southampton	3rd Class Steward	0	22	Male	False	Victualling
"EDGE, Mr Frederick William"	Crew	Southampton	Deck Steward (2nd class)	0	39	Male	False	Victualling
"EDWARDS, Mr Charles Essex"	Crew	Southampton	Assistant Pantryman Steward (1st Class)	0	39	Male	False	Victualling
"EGG, Mr William Henry"	Crew	Southampton	Third class steward	0	47	Male	False	Victualling
"ELLIS, Mr John Bertie"	Crew	Southampton	Assistant Vegetable Cook	0	28	Male	True	Victualling
"ENNIS, Mr Walter"	Crew	Southampton	Turkish Bath Attendant	0	34	Male	False	Victualling
"ETCHES, Mr Henry Samuel"	Crew	Belfast	First class bedroom steward	0	43	Male	True	Victualling
"EVANS, Mr George Richard"	Crew	Belfast	Saloon Steward (1st class)	0	27	Male	False	Victualling
"FAIRALL, Mr Henry Charles"	Crew	Belfast	Saloon Steward (1st class)	0	38	Male	False	Victualling
"FARENDEN, Mr Ernest John"	Crew	Belfast	Confectioner	0	22	Male	False	Victualling
"FAULKNER, Mr William Stephen"	Crew	Belfast	1st Class Bedroom Steward	0	37	Male	True	Victualling
"FELLOWES, Mr Alfred James"	Crew	Belfast	Assistant boots steward (1st class)	0	29	Male	False	Victualling
"FELTHAM, Mr George William"	Crew	Southampton	Vienna Baker	0	36	Male	False	Victualling
"FINCH, Mr Henry Herman"	Crew	Southampton	Steward (3rd Class)	0	18	Male	False	Victualling
"FLETCHER, Mr Percy William"	Crew	Belfast	Bugler Steward	0	26	Male	False	Victualling
"FOLEY, Mr Wilfred Cyril"	Crew	Southampton	3rd Class Steward	0	22	Male	True	Victualling
"FORD, Mr Ernest"	Crew	Southampton	3rd Class Steward	0	32	Male	False	Victualling
"FORD, Mr Francis"	Crew	Southampton	Bedroom Steward (2nd class)	0	37	Male	False	Victualling
"FOX, Mr William Thomas"	Crew	Southampton	Steward	0	27	Male	False	Victualling
"FRANKLIN, Mr Alan Vincent"	Crew	Southampton	Saloon Steward (2nd class)	0	28	Male	False	Victualling
"FREEMAN, Mr Ernest Edward Samuel"	Crew	Belfast	Deck Steward (1st Class)	0	45	Male	False	Victualling
"GEDDES, Mr Richard Charles"	Crew	Southampton	Bed Room Steward (1st class)	0	31	Male	False	Victualling
"GIBBONS, Mr Jacob William"	Crew	Southampton	Second Class Steward	0	36	Male	True	Victualling
"GILES, Mr John Robert"	Crew	Southampton	2nd Baker	0	32	Male	False	Victualling
"GILL, Mr Joseph Stanley"	Crew	Belfast	Bed Room Steward	0	38	Male	False	Victualling
"GILL, Mr Patrick"	Crew	Southampton	Ship's Cook	0	38	Male	False	Victualling
"GOLD, Mrs Jane Kate Coulson"	Crew	Southampton	Stewardess	0	45	Female	True	Victualling
"GOLLOP, Mr F."	Crew	Southampton	Assistant Passage Cook	0	28	Male	False	Victualling
"GOSHAWK, Mr Alfred James"	Crew	Belfast	Saloon Steward (1st class)	0	40	Male	False	Victualling
"GREGSON, Miss Mary"	Crew	Southampton	Stewardess	0	45	Female	True	Victualling
"GUNN, Mr Joseph Alfred"	Crew	Southampton	Assistant Saloon Steward (2nd Class)	0	28	Male	False	Victualling
"GUY, Mr Elgar John"	Crew	Southampton	Boots	0	28	Male	True	Victualling
"GWINN, Mr William Logan"	Crew	Southampton	Postal Clerk / Postman	0	37	Male	False	Victualling
"HALFORD, Mr Walter Stamford"	Crew	Southampton	Steward	0	22	Male	True	Victualling
"HALL, Mr Frank Alfred James"	Crew	Southampton	Scullion	0	38	Male	False	Victualling
"HAMBLYN, Mr Ernest William"	Crew	Southampton	2nd Class Bedroom Steward	0	46	Male	False	Victualling
"HAMILTON, Mr Ernest"	Crew	Belfast	Assistant Smoke Room Steward (1st class)	0	25	Male	False	Victualling
"HARDING, Mr Alfred John"	Crew	Southampton	Assistant Pantry Steward (2nd class)	0	20	Male	False	Victualling
"HARDWICK, Mr Reginald"	Crew	Southampton	Kitchen Porter	0	21	Male	True	Victualling
"HARDY, Mr John"	Crew	Belfast	Chief Second Class Steward	0	40	Male	True	Victualling
"HARRIS, Mr Charles William"	Crew	Southampton	Saloon Steward (2nd class)	0	19	Male	False	Victualling
"HARRIS, Mr Clifford Henry"	Crew	Southampton	Bell Boy	0	16	Male	False	Victualling
"HARRIS, Mr Edward Matthew"	Crew	Southampton	Assistant Pantryman Steward (1st Class)	0	18	Male	False	Victualling
"HARRISON, Mr Aragõa Drummond"	Crew	Southampton	Saloon Steward (1st class)	0	40	Male	True	Victualling
"HART, Mr John Edward"	Crew	Southampton	Steward	0	31	Male	True	Victualling
"HARTNELL, Mr Fred"	Crew	Southampton	Saloon Steward	0	21	Male	True	Victualling
"HATCH, Mr Hugh"	Crew	Southampton	Scullion	0	23	Male	False	Victualling
"HAWKESWORTH, Mr James"	Crew	Southampton	Saloon Steward (2nd class)	0	38	Male	False	Victualling
"HAWKESWORTH, Mr William Walter"	Crew	Southampton	Deck Steward (1st class)	0	43	Male	False	Victualling
"HAYTER, Mr Arthur"	Crew	Belfast	Bed Room Steward	0	44	Male	False	Victualling
"HEINEN, Mr Joseph Dominichus"	Crew	Southampton	Saloon Steward (2nd class)	0	30	Male	False	Victualling
"HENDY, Mr Edward Martin"	Crew	Belfast	Saloon Steward	0	39	Male	False	Victualling
"HENSFORD, Mr Herbert George Ernest"	Crew	Southampton	Assistant Butcher	0	26	Male	False	Victualling
"HEWITT, Mr Thomas"	Crew	Belfast	Bed Room Steward (1st class)	0	37	Male	False	Victualling
"HILL, Mr H. P."	Crew	Southampton	Steward	0	36	Male	False	Victualling
"HILL, Mr James Colston"	Crew	Belfast	1st Class Bedroom Steward	0	38	Male	False	Victualling
"HINCKLEY, Mr George Herbert"	Crew	Southampton	Bathroom Steward (1st Class)	0	39	Male	False	Victualling
"HINE, Mr William Edward"	Crew	Southampton	3rd Baker	0	36	Male	False	Victualling
"HISCOCK, Mr Sydney George"	Crew	Southampton	Plate Steward	0	22	Male	False	Victualling
"HOARE, Mr Leonard James"	Crew	Belfast	Saloon Steward	0	16	Male	False	Victualling
"HOGG, Mr Charles William"	Crew	Southampton	1st Class Bedroom Steward	0	43	Male	False	Victualling
"HOGUE, Mr E."	Crew	Southampton	Plate Steward	0	22	Male	False	Victualling
"HOLLAND, Mr Thomas"	Crew	Belfast	Reception Steward	0	28	Male	False	Victualling
"HOLLOWAY, Mr Sidney"	Crew	Southampton	Assistant clothes presser steward	0	20	Male	False	Victualling
"HOPKINS, Mr Frederick William"	Crew	Southampton	Plate Steward	0	16	Male	False	Victualling
"HOUSE, Mr William John"	Crew	Belfast	Saloon Steward (1st class)	0	38	Male	False	Victualling
"HOWELL, Mr Arthur Albert"	Crew	Belfast	Saloon Steward (1st class)	0	31	Male	False	Victualling
"HUGHES, Mr William Thomas"	Crew	Southampton	Assistant Second Steward (1st Class)	0	33	Male	False	Victualling
"HUMBY, Mr Frederick Charles"	Crew	Southampton	Plate Steward (2nd Class)	0	17	Male	False	Victualling
"HUMPHREYS, Mr Humphrey"	Crew	Southampton	"Assistant Saloon Steward, 2nd Class"	0	31	Male	False	Victualling
"HUTCHINSON, Mr James"	Crew	Southampton	Vegetable. Cook	0	28	Male	False	Victualling
"HYLAND, Mr James Leo"	Crew	Southampton	Steward (3rd Class)	0	19	Male	True	Victualling
"IDE, Mr Harry John"	Crew	Southampton	1st Class Bedroom Steward	0	31	Male	False	Victualling
"INGROUILLE, Mr Henry"	Crew	Southampton	Steward	0	21	Male	False	Victualling
"INGS, Mr William Ernest"	Crew	Southampton	Scullion	0	20	Male	False	Victualling
"JACKSON, Mr Cecil"	Crew	Belfast	Assistant boots steward (1st class)	0	22	Male	False	Victualling
"JANAWAY, Mr William Frank"	Crew	Belfast	Bed Room Steward	0	35	Male	False	Victualling
"JENNER, Mr Thomas Henry (Harry)"	Crew	Belfast	Saloon Steward	0	55	Male	False	Victualling
"JENSEN, Mr Charles Valdemar"	Crew	Southampton	Saloon Steward	0	25	Male	False	Victualling
"JESSOP, Miss Violet Constance"	Crew	Southampton	Stewardess	0	24	Female	True	Victualling
"JOHNSTON, Mr James"	Crew	Belfast	Saloon Steward	0	41	Male	True	Victualling
"JONES, Mr Albert Hugh Brabner"	Crew	Southampton	Saloon Steward (2nd class)	0	17	Male	False	Victualling
"JONES, Mr Arthur Ernest"	Crew	Southampton	Plate Steward (2nd Class)	0	37	Male	False	Victualling
"JONES, Mr H."	Crew	Southampton	Roast Cook	0	29	Male	False	Victualling
"JONES, Mr Victor Reginald"	Crew	Southampton	Saloon Steward (1st class)	0	20	Male	False	Victualling
"JOUGHIN, Mr Charles John"	Crew	Belfast	Chief Baker	0	32	Male	True	Victualling
"KEEN, Mr Percy Edward"	Crew	Southampton	Saloon Steward (1st class)	0	30	Male	True	Victualling
"KELLAND, Mr Thomas"	Crew	Southampton	2nd class library steward	0	18	Male	False	Victualling
"KENNELL, Mr Charles"	Crew	Southampton	Hebrew Cook	0	30	Male	False	Victualling
"KERLEY, Mr William Thomas"	Crew	Southampton	Assistant Saloon Steward (2nd class)	0	28	Male	False	Victualling
"KETCHLEY, Mr Henry"	Crew	Belfast	Saloon Steward	0	35	Male	False	Victualling
"KIERAN, Mr James William"	Crew	Southampton	Chief 3rd Class Steward	0	34	Male	False	Victualling
"KIERAN, Mr Edgar Michael"	Crew	Southampton	Storekeeper	0	34	Male	False	Victualling
"KING, Mr Alfred John Moffett"	Crew	Southampton	Lift Steward	0	18	Male	False	Victualling
"KING, Mr Ernest Waldron"	Crew	Southampton	Clerk (1st class)	0	28	Male	False	Victualling
"KING, Mr G."	Crew	Southampton	Scullion	0	20	Male	False	Victualling
"KINGSCOTE, Mr William Ford"	Crew	Southampton	Saloon Steward (1st class)	0	42	Male	False	Victualling
"KIRKALDY, Mr Thomas Benjamin"	Crew	Southampton	Bed Room Steward	0	39	Male	False	Victualling
"KITCHING, Mr Arthur Alfred"	Crew	Southampton	Saloon Steward (1st class)	0	30	Male	False	Victualling
"KLEIN, Mr Herbert"	Crew	Southampton	Barber	0	33	Male	False	Victualling
"KNIGHT, Mr George"	Crew	Southampton	Saloon Steward	0	44	Male	True	Victualling
"KNIGHT, Mr Leonard George"	Crew	Southampton	Steward (3rd class)	0	21	Male	False	Victualling
"LACEY, Mr Bertie William"	Crew	Southampton	"Assistant Saloon steward, 2nd Class"	0	19	Male	False	Victualling
"LAKE, Mr William"	Crew	Belfast	Saloon Steward	0	35	Male	False	Victualling
"LANE, Mr Albert Edward"	Crew	Southampton	Saloon Steward (1st class)	0	34	Male	False	Victualling
"LATIMER, Mr Andrew"	Crew	Belfast	Chief Steward	0	55	Male	False	Victualling
"LAVINGTON, Miss Elizabeth"	Crew	Southampton	Stewardess	0	40	Female	True	Victualling
"LAWRENCE, Mr Arthur"	Crew	Belfast	Saloon Steward (1st class)	0	35	Male	False	Victualling
"LEADER, Mr Archibald"	Crew	Southampton	Confectioner	0	22	Male	False	Victualling
"LEATHER, Mrs Elizabeth Mary"	Crew	Southampton	Stewardess	0	41	Female	True	Victualling
"LEE, Mr Henry Reginald"	Crew	Southampton	Scullion	0	29	Male	True	Victualling
"LEFEBVRE, Mr Paul Georges"	Crew	Southampton	Saloon Steward	0	35	Male	False	Victualling
"LEONARD, Mr Matthew"	Crew	Belfast	3rd Class Steward	0	25	Male	False	Victualling
"LEVETT, Mr George Alfred"	Crew	Belfast	Assistant Pantryman Steward (1st Class)	0	21	Male	False	Victualling
"LEWIS, Mr Arthur Ernest Read"	Crew	Southampton	Steward	0	27	Male	True	Victualling
"LIGHT, Mr Charles Edward"	Crew	Southampton	Plate Steward (1st class)	0	23	Male	False	Victualling
"LITTLEJOHN, Mr Alexander James"	Crew	Belfast	Saloon Steward (1st class)	0	40	Male	True	Victualling
"LLOYD, Mr Humphrey"	Crew	Belfast	Saloon Steward (1st class)	0	41	Male	False	Victualling
"LOCKE, Mr A."	Crew	Southampton	Scullion	0	33	Male	False	Victualling
"LONGMUIR, Mr John Dickson"	Crew	Southampton	Assistant Pantry Steward (2nd class)	0	19	Male	False	Victualling
"LOVELL, Mr John"	Crew	Southampton	Grill Cook	0	37	Male	False	Victualling
"LUCAS, Mr William Watson"	Crew	Belfast	Saloon Steward (1st class)	0	31	Male	True	Victualling
"LYDIATT, Mr Charles"	Crew	Southampton	Saloon Steward (1st class)	0	45	Male	False	Victualling
"MABEY, Mr John Charles"	Crew	Southampton	3rd Class Steward	0	23	Male	False	Victualling
"MACKAY, Mr Charles Donald"	Crew	Belfast	Saloon Steward	0	34	Female	True	Victualling
"MACKIE, Mr George William"	Crew	Southampton	2nd Class Bedroom Steward	0	34	Male	False	Victualling
"MAJOR, Mr Thomas Edgar"	Crew	Belfast	Bathroom Steward (1st Class)	0	35	Male	False	Victualling
"MANTLE, Mr Roland Frederick"	Crew	Southampton	3rd Class Steward	0	40	Male	False	Victualling
"MARCH, Mr John Starr"	Crew	Southampton	Postal Clerk / Postman	0	50	Male	False	Victualling
"MARKS, Mr James"	Crew	Southampton	Assistant Pantryman Steward (1st Class)	0	27	Male	False	Victualling
"MARRIOTT, Mr John William"	Crew	Southampton	Assistant Pantryman Steward (1st Class)	0	20	Male	False	Victualling
"MARSDEN, Miss Evelyn"	Crew	Southampton	Stewardess	0	28	Female	True	Victualling
"MARTIN, Mrs Annie Martha"	Crew	Southampton	Stewardess	0	39	Female	True	Victualling
"MAYNARD, Mr Isaac Hiram"	Crew	Belfast	Entrée Cook	0	31	Male	True	Victualling
"MAYTUM, Mr Alfred"	Crew	Belfast	Chief Butcher	0	52	Male	False	Victualling
"MüLLER, Mr Ludwig"	Crew	Southampton	Interpreter Steward (3rd Class)	0	36	Male	False	Victualling
"MCCARTHY, Mr Frederick James"	Crew	Southampton	Bedroom Steward (1st Class)	0	38	Male	False	Victualling
"MCCAWLEY, Mr Thomas W."	Crew	Belfast	Gymnasium Steward	0	36	Male	False	Victualling
"MCELROY, Mr Hugh Walter"	Crew	Southampton	Purser	0	37	Male	False	Victualling
"MCGRADY, Mr James"	Crew	Southampton	Saloon Steward	0	27	Male	False	Victualling
"MCLAREN, Mrs Hypatia"	Crew	Southampton	Stewardess	0	40	Female	True	Victualling
"MCMICKEN, Mr Arthur"	Crew	Belfast	Saloon Steward (1st class)	0	23	Male	True	Victualling
"MCMICKEN, Mr Benjamin Tucker"	Crew	Belfast	Second Pantry Steward	0	21	Male	False	Victualling
"MCMULLIN, Mr John Richard"	Crew	Belfast	First class saloon steward	0	32	Male	False	Victualling
"MCMURRAY, Mr William"	Crew	Belfast	1st Class Bedroom Steward	0	43	Male	False	Victualling
"MELLOR, Mr Arthur"	Crew	Southampton	Saloon Steward	0	34	Male	False	Victualling
"MIDDLETON, Mr Mark Victor"	Crew	Southampton	Saloon Steward (2nd class)	0	24	Male	False	Victualling
"MILLS, Mr Christopher"	Crew	Southampton	Butcher	0	51	Male	True	Victualling
"MISHELLANY, Mr Abraham Mansoor"	Crew	Belfast	Printer Steward	0	53	Male	False	Victualling
"MOORE, Mr Alfred Ernest"	Crew	Southampton	"Saloon Steward, 2nd Class"	0	39	Male	False	Victualling
"MORGAN (BIRD), Mr Charles Frederick"	Crew	Southampton	Storekeeper (1st Class)	0	42	Male	False	Victualling
"MORRIS, Mr Frank Herbert"	Crew	Belfast	Bathroom Steward (1st Class)	0	28	Male	True	Victualling
"MOSS, Mr William"	Crew	Belfast	1st. Saloon Steward	0	34	Male	False	Victualling
"MULLIN, Mr Thomas"	Crew	Southampton	3rd Class Steward	0	20	Male	False	Victualling
"NEAL, Mr Bentley Harold"	Crew	Southampton	Baker	0	25	Male	True	Victualling
"NICHOLLS, Mr Sidney"	Crew	Southampton	Saloon Steward	0	39	Male	False	Victualling
"NICHOLS, Mr A.D."	Crew	Southampton	Steward	0	34	Male	False	Victualling
"NICHOLS, Mr Walter Henry"	Crew	Southampton	"Assistant Saloon Steward, 2nd class"	0	35	Male	True	Victualling
"O'CONNOR, Mr Thomas Peter"	Crew	Belfast	1st Class Bedroom Steward	0	43	Male	False	Victualling
"OLIVE, Mr Ernest Roskelly"	Crew	Southampton	Clothes Presser Steward (1st class)	0	26	Male	False	Victualling
"ORPET, Mr Walter Hayward"	Crew	Southampton	Saloon Steward	0	31	Male	False	Victualling
"ORR, Mr J."	Crew	Southampton	Assistant Vegetable Cook	0	40	Male	False	Victualling
"OSBORNE, Mr William Edward"	Crew	Belfast	Saloon Steward	0	32	Male	False	Victualling
"OWEN, Mr Lewis"	Crew	Southampton	Assistant Saloon Steward	0	49	Male	False	Victualling
"PACEY, Mr Reginald lvan"	Crew	Southampton	Lift Steward	0	17	Male	False	Victualling
"PAINTIN, Mr James Arthur"	Crew	Southampton	Captain's Steward (Tiger)	0	29	Male	False	Victualling
"PARSONS, Mr Edward"	Crew	Southampton	Chief Storekeeper (1st Class)	0	37	Male	False	Victualling
"PARSONS, Mr Richard Henry"	Crew	Southampton	Saloon Steward (2nd class)	0	18	Male	False	Victualling
"PEARCE, Mr Alfred Emest"	Crew	Southampton	Steward	0	24	Male	False	Victualling
"PEARCEY, Mr Albert Victor"	Crew	Southampton	Pantry Steward (3rd Class)	0	25	Male	True	Victualling
"PENNAL, Mr Thomas Frederick Cohen"	Crew	Southampton	Bathroom Steward (1st Class)	0	33	Male	False	Victualling
"PENNY, Mr William Farr"	Crew	Southampton	Assistant Saloon Steward (2nd Class)	0	31	Male	False	Victualling
"PENROSE, Mr John Poole"	Crew	Belfast	Bedroom Steward (1st Class)	0	49	Male	False	Victualling
"PERKINS, Mr Laurence Alexander"	Crew	Southampton	Telephone Operator Steward	0	22	Male	False	Victualling
"PERREN, Mr William Charles"	Crew	Southampton	Boots Steward (2nd class)	0	47	Male	False	Victualling
"PERRITON, Mr Hubert Prouse"	Crew	Southampton	Saloon Steward (1st class)	0	31	Male	False	Victualling
"PETTY, Mr Edwin Henry"	Crew	Southampton	Bedroom Steward (2nd class)	0	25	Male	False	Victualling
"PFROPPER, Mr Richard Paul Jozef"	Crew	Southampton	Saloon Steward	0	30	Male	True	Victualling
"PHILLIMORE, Mr Harold Charles William"	Crew	Belfast	Saloon Steward (2nd class)	0	23	Male	True	Victualling
"PHILLIPS, Mr John George"	Crew	Belfast	Telegraphist	0	25	Male	False	Victualling
"PLATT, Mr Wilfred George"	Crew	Southampton	Scullion	0	18	Male	False	Victualling
"POOK, Mr Percy Robert"	Crew	Southampton	Assistant pantry steward	0	34	Male	False	Victualling
"PORT, Mr Frank"	Crew	Southampton	Steward	0	22	Male	True	Victualling
"PORTEUS, Mr Thomas Henry"	Crew	Southampton	Butcher	0	32	Male	False	Victualling
"PRENTICE, Mr Frank Winnold"	Crew	Southampton	Storekeeper	0	23	Male	True	Victualling
"PRICHARD, Mrs Alice Maud"	Crew	Southampton	Stewardess	0	34	Female	True	Victualling
"PRIDEAUX, Mr John Arthur (Jack)"	Crew	Southampton	3rd Class Steward	0	23	Male	False	Victualling
"PRIOR, Mr Harold John Arnold"	Crew	Southampton	Steward (3rd Class)	0	21	Male	True	Victualling
"PROCTOR, Mr Charles"	Crew	Belfast	Chef	0	45	Male	False	Victualling
"PRYCE, Mr Charles William"	Crew	Southampton	Saloon Steward (1st class)	0	22	Male	False	Victualling
"PUGH, Mr Alfred"	Crew	Southampton	3rd Class Steward	0	20	Male	True	Victualling
"PUZEY, Mr John Edward"	Crew	Belfast	Saloon Steward (1st class)	0	44	Male	False	Victualling
"RANDALL, Mr Frank Henry"	Crew	Southampton	Saloon Steward (2nd class)	0	29	Male	False	Victualling
"RANSOM, Mr James Augustus"	Crew	Belfast	Saloon Steward (1st class)	0	49	Male	False	Victualling
"RATTENBURY, Mr William Henry"	Crew	Belfast	Boots steward (1st class)	0	37	Male	False	Victualling
"RAY, Mr Frederick Dent"	Crew	Belfast	Saloon Steward	0	32	Male	True	Victualling
"REED, Mr Thomas Charles Prowse"	Crew	Southampton	Bed Room Steward	0	54	Male	False	Victualling
"REVELL, Mr William James Francis"	Crew	Belfast	Saloon Steward (1st class)	0	31	Male	False	Victualling
"RICE, Mr John Reginald"	Crew	Southampton	1st Class Clerk	0	25	Male	False	Victualling
"RICE, Mr Percy"	Crew	Southampton	3rd Class Steward	0	19	Male	False	Victualling
"RICKS, Mr Cyril Gordon"	Crew	Southampton	Storekeeper	0	23	Male	False	Victualling
"RIDOUT, Mr Walter George"	Crew	Southampton	Second Class Saloon Steward	0	29	Male	False	Victualling
"RIMMER, Mr Gilbert"	Crew	Southampton	Saloon Steward	0	28	Male	False	Victualling
"ROBERTON, Mr George Edward"	Crew	Southampton	Assistant Saloon Steward (2nd Class)	0	19	Male	False	Victualling
"ROBERTS, Mrs Mary Kezia"	Crew	Southampton	Stewardess	0	41	Female	True	Victualling
"ROBERTS, Mr Frank John"	Crew	Belfast	Third Butcher	0	36	Male	False	Victualling
"ROBERTS, Mr Hugh H."	Crew	Belfast	Bed Room Steward	0	40	Male	False	Victualling
"ROBINSON, Mrs Annie"	Crew	Southampton	Stewardess	0	40	Female	True	Victualling
"ROBINSON, Mr James William"	Crew	Southampton	Saloon Steward (1st class)	0	30	Male	False	Victualling
"ROGERS, Mr Edward James William"	Crew	Southampton	Assistant Storekeeper	0	31	Male	False	Victualling
"ROGERS, Mr Michael"	Crew	Southampton	Saloon Steward	0	27	Male	False	Victualling
"ROSS, Mr Horace Leopold"	Crew	Southampton	Scullion	0	38	Male	True	Victualling
"ROWE, Mr Edgar Maurice"	Crew	Belfast	Saloon Steward (1st class)	0	31	Male	False	Victualling
"RULE, Mr Samuel James"	Crew	Belfast	Bathroom Steward (1st Class)	0	58	Male	True	Victualling
"RUSSELL, Mr Boysie Richard"	Crew	Southampton	Saloon Steward (2nd class)	0	17	Male	False	Victualling
"RYAN, Mr Thomas"	Crew	Southampton	Steward	0	27	Male	False	Victualling
"RYERSON, Mr William Edwy"	Crew	Southampton	Saloon Steward (2nd class)	0	33	Male	True	Victualling
"SAMUEL, Mr Owen Wilmore"	Crew	Southampton	Saloon Steward (2nd class)	0	46	Male	False	Victualling
"SAUNDERS, Mr D. E."	Crew	Southampton	Saloon Steward	0	26	Male	False	Victualling
"SAVAGE, Mr Charles Joseph"	Crew	Southampton	Steward	0	23	Male	True	Victualling
"SCOTT, Mr John"	Crew	Southampton	Assistant boots steward (1st Class)	0	19	Male	False	Victualling
"SCOVELL, Mr Robert"	Crew	Southampton	Saloon Steward (2nd class)	0	54	Male	False	Victualling
"SEDUNARY, Mr Samuel Francis"	Crew	Southampton	Second third class steward	0	25	Male	False	Victualling
"SEWARD, Mr Wilfred Deable"	Crew	Southampton	Chief Pantry Steward (2nd Class)	0	25	Male	True	Victualling
"SHAW, Mr Henry"	Crew	Southampton	Kitchen Porter	0	39	Male	False	Victualling
"SHEA, Mr John Joseph"	Crew	Belfast	Saloon Steward (1st class)	0	39	Male	False	Victualling
"SIEBERT, Mr Sidney Conrad"	Crew	Belfast	Bed Room Steward	0	29	Male	False	Victualling
"SIMMONS, Mr Andrew George James"	Crew	Southampton	Scullion	0	31	Male	True	Victualling
"SIMMONS, Mr Frederick Charles"	Crew	Southampton	Saloon Steward	0	24	Male	False	Victualling
"SIMMONS, Mr William Simon C."	Crew	Southampton	Passage Cook	0	35	Male	False	Victualling
"SIVIER, Mr William"	Crew	Southampton	Steward (3rd Class)	0	23	Male	False	Victualling
"SKINNER, Mr Edward"	Crew	Belfast	Saloon Steward (1st class)	0	33	Male	False	Victualling
"SLIGHT, Mr Harry John"	Crew	Southampton	3rd Class Steward	0	33	Male	False	Victualling
"SLIGHT, Mr William Henry James"	Crew	Belfast	Larder Cook	0	36	Male	False	Victualling
"SLOAN, Miss Mary"	Crew	Southampton	Stewardess	0	28	Female	True	Victualling
"SLOCOMBE, Mrs Maude Louise"	Crew	Southampton	Turkish Bath Stewardess	0	30	Female	True	Victualling
"SMILLIE, Mr John"	Crew	Belfast	Saloon Steward	0	29	Male	False	Victualling
"SMITH, Mr Charles"	Crew	Southampton	Kitchen Porter	0	38	Male	False	Victualling
"SMITH, Mr Charles Edwin"	Crew	Southampton	2nd Class Bedroom Steward	0	38	Male	False	Victualling
"SMITH, Mr F."	Crew	Belfast	Assistant Pantryman Steward	0	20	Male	False	Victualling
"SMITH, Mr James William"	Crew	Southampton	Assistant baker	0	24	Male	False	Victualling
"SMITH, Mr John Richard Jago"	Crew	Southampton	Postal Clerk / Postman	0	35	Male	False	Victualling
"SMITH, Miss Katherine Elizabeth"	Crew	Southampton	Stewardess	0	44	Female	True	Victualling
"SMITH, Mr Reginald George"	Crew	Southampton	Saloon Steward (1st class)	0	32	Male	False	Victualling
"SNAPE, Mrs Lucy Violet"	Crew	Southampton	Stewardess	0	22	Female	False	Victualling
"STAGG, Mr John Henry"	Crew	Southampton	Saloon Steward	0	38	Male	False	Victualling
"STAP, Miss Sarah Agnes"	Crew	Southampton	Stewardess	0	47	Female	True	Victualling
"STEBBINGS, Mr Sydney Frederick"	Crew	Belfast	Chief Boots Steward (1st Class)	0	35	Male	False	Victualling
"STEWART, Mr John"	Crew	Belfast	Verandah Steward	0	27	Male	True	Victualling
"STONE, Mr Edmund"	Crew	Southampton	1st Class Bedroom Steward	0	33	Male	False	Victualling
"STONE, Mr Edward Thomas"	Crew	Southampton	Bedroom Steward (2nd class)	0	29	Male	False	Victualling
"STROUD, Mr Edward Alfred Orlando"	Crew	Southampton	Saloon Steward (2nd class)	0	19	Male	False	Victualling
"STROUD, Mr Harry John"	Crew	Southampton	Saloon Steward	0	35	Male	False	Victualling
"STRUGNELL, Mr John Herbert"	Crew	Belfast	Saloon Steward (1st class)	0	34	Male	False	Victualling
"STUBBINGS, Mr Harry Robert"	Crew	Belfast	2nd. Class Cook	0	31	Male	False	Victualling
"SWAN, Mr William"	Crew	Belfast	1st Class Bedroom Steward	0	46	Male	False	Victualling
"SYMONDS, Mr John Crane"	Crew	Belfast	Saloon Steward	0	44	Male	False	Victualling
"TALBOT, Mr George Frederick Charles"	Crew	Southampton	Steward	0	20	Male	False	Victualling
"TAYLOR, Mr Bernard Cuthbert"	Crew	Southampton	3rd Class Steward	0	22	Male	False	Victualling
"TAYLOR, Mr Leonard"	Crew	Southampton	Turkish Bath Attendant	0	23	Male	False	Victualling
"TAYLOR, Mr William John"	Crew	Southampton	Saloon Steward (1st class)	0	30	Male	False	Victualling
"TERRELL, Mr Frank"	Crew	Southampton	Assistant Saloon Steward	0	27	Male	True	Victualling
"TEUTON, Mr Thomas Moore"	Crew	Southampton	Saloon Steward	0	32	Male	False	Victualling
"THALER, Mr Montague Donald"	Crew	Southampton	Steward (3rd Class)	0	17	Female	False	Victualling
"THEISSINGER, Mr Alfred"	Crew	Southampton	Bed Room Steward	0	46	Male	True	Victualling
"THOMAS, Mr Benjamin James"	Crew	Belfast	Saloon Steward	0	30	Male	True	Victualling
"THOMAS, Mr Albert Charles"	Crew	Southampton	Saloon Steward	0	23	Male	True	Victualling
"THOMPSON, Mr Herbert Henry"	Crew	Belfast	2nd (Assistant) Storekeeper	0	25	Male	False	Victualling
"THORLEY, Mr William"	Crew	Southampton	Cook	0	39	Male	False	Victualling
"THORN, Mr Harry"	Crew	Southampton	Assistant Ship's Cook	0	25	Male	False	Victualling
"TOMS, Mr Fred"	Crew	Belfast	Saloon Steward	0	29	Male	True	Victualling
"TOPP, Mr Thomas"	Crew	Southampton	2nd Butcher	0	28	Male	False	Victualling
"TOSHACK, Mr James Adamson"	Crew	Southampton	Saloon Steward (1st class)	0	30	Male	False	Victualling
"TURNER, Mr George Frederick"	Crew	Southampton	Stenographer	0	32	Male	False	Victualling
"TURNER, Mr Leopold Olerenshaw"	Crew	Belfast	Saloon Steward (1st class)	0	28	Male	False	Victualling
"VEAL, Mr Thomas Henry Edom"	Crew	Southampton	Saloon Steward (1st class)	0	38	Male	False	Victualling
"WAKE, Mr Percy"	Crew	Southampton	Assistant baker	0	37	Male	False	Victualling
"WALLIS, Mrs Catherine Jane"	Crew	Southampton	Matron	0	35	Female	False	Victualling
"WALPOLE, Mr James"	Crew	Belfast	Chief Pantryman Steward	0	48	Male	False	Victualling
"WALSH, Miss Catherine"	Crew	Southampton	Stewardess	0	32	Female	False	Victualling
"WARD, Mr Edward"	Crew	Belfast	Bed Room Steward	0	34	Male	False	Victualling
"WARD, Mr Percy Thomas"	Crew	Belfast	Bedroom Steward (1st Class)	0	38	Male	False	Victualling
"WARD, Mr William"	Crew	Southampton	Saloon Steward	0	36	Male	True	Victualling
"WAREHAM, Mr Robert Arthur"	Crew	Belfast	Bed Room Steward	0	37	Male	False	Victualling
"WARWICK, Mr Tom"	Crew	Southampton	Saloon Steward	0	25	Male	False	Victualling
"WATSON, Mr William Albert"	Crew	Southampton	Bell Boy	0	14	Male	False	Victualling
"WEATHERSTON, Mr Thomas Herbert"	Crew	Belfast	Saloon Steward (1st class)	0	24	Male	False	Victualling
"WEBB, Mr Brook Holding"	Crew	Belfast	Smoke Room Steward (1st class)	0	50	Male	False	Victualling
"WEIKMAN, Mr Augustus Henry"	Crew	Southampton	Barber	0	52	Male	True	Victualling
"WELCH, Mr William Harold"	Crew	Southampton	Cook	0	23	Male	False	Victualling
"WHEAT, Mr Joseph Thomas"	Crew	Belfast	Assistant Second Steward	0	30	Male	True	Victualling
"WHEELTON, Mr Edneser Edward"	Crew	Belfast	Saloon Steward (1st class)	0	29	Male	True	Victualling
"WHITE, Mr Arthur"	Crew	Southampton	Assistant Barber (1st Class)	0	37	Male	False	Victualling
"WHITE, Mr Edward Joseph"	Crew	Southampton	Glory hole steward (3rd class)	0	27	Male	False	Victualling
"WHITE, Mr Leonard Lisle Oliver"	Crew	Belfast	Saloon Steward	0	31	Male	False	Victualling
"WHITELEY, Mr Thomas Arthur"	Crew	Southampton	Saloon Steward	0	18	Male	True	Victualling
"WHITFORD, Mr Alfred Henry"	Crew	Southampton	"Saloon Steward, 2nd Class"	0	39	Male	False	Victualling
"WIDGERY, Mr James George"	Crew	Southampton	Bath Steward	0	37	Male	True	Victualling
"WILLIAMS, Mr Arthur John"	Crew	Southampton	Storekeeper (1st Class)	0	42	Male	False	Victualling
"WILLIAMS, Mr Walter John"	Crew	Southampton	Saloon Steward (2nd class)	0	28	Male	True	Victualling
"WILLIAMSON, Mr James Bertram"	Crew	Southampton	Postal Clerk / Postman	0	35	Male	False	Victualling
"WILLIS, Mr William"	Crew	Southampton	3rd Class Packer Steward	0	46	Male	False	Victualling
"WILLSHER, Mr William Aubrey"	Crew	Southampton	Butcher	0	33	Male	False	Victualling
"WINDEBANK, Mr Alfred Edgar"	Crew	Southampton	Cook	0	38	Male	True	Victualling
"WINSER, Mr Rowland"	Crew	Southampton	Steward	0	33	Male	False	Victualling
"WITTER, Mr James William Cheetham"	Crew	Southampton	Smoke Room Steward (2nd Class)	0	31	Male	True	Victualling
"WITTMAN, Mr Henry"	Crew	Southampton	Bathroom Steward (1st Class)	0	38	Male	False	Victualling
"WOOD, Mr James Thomas"	Crew	Southampton	"Assistant Saloon Steward, 2nd Class"	0	40	Male	False	Victualling
"WOODY, Mr Oscar Scott"	Crew	Southampton	Postal Clerk / Postman	0	44	Male	False	Victualling
"WORMALD, Mr Henry Frederick Charles"	Crew	Southampton	Saloon Steward	0	44	Male	False	Victualling
"WRAPSON, Mr Frederick Bernard"	Crew	Belfast	Assistant Pantryman Steward	0	18	Male	False	Victualling
"WRIGHT, Mr Frederick"	Crew	Southampton	Squash racquet court attendant	0	24	Male	False	Victualling
"WRIGHT, Mr William"	Crew	Southampton	Glory Hole Steward	0	40	Male	True	Victualling
"YEARSLEY, Mr Harry"	Crew	Southampton	First class saloon steward	0	40	Male	True	Victualling
"ALLARIA, Sig. Battista Antonio"	Crew	Southampton	Assistant Waiter	0	22	Male	False	Restaurant
"ASPESLAGH, Mr Georges"	Crew	Southampton	Assistant Plateman	0	26	Male	False	Restaurant
"BANFI, Sig. Ugo"	Crew	Southampton	Waiter	0	24	Male	False	Restaurant
"BASILICO, Sig. Giovanni"	Crew	Southampton	Waiter	0	27	Male	False	Restaurant
"BAZZI, Sig. Narciso"	Crew	Southampton	Waiter	0	33	Male	False	Restaurant
"BERNARDI, Sig. Battista"	Crew	Southampton	Assistant Waiter	0	22	Male	False	Restaurant
"BEUX, Mr David"	Crew	Southampton	Assistant Waiter	0	26	Male	False	Restaurant
"BIETRIX, Mr George Baptiste"	Crew	Southampton	Cook	0	28	Male	False	Restaurant
"BLUMET, Mr Jean Baptiste"	Crew	Southampton	Pantryman	0	26	Male	False	Restaurant
"BOCHET, Mr Pierre Giuseppe"	Crew	Southampton	Waiter	0	25	Male	False	Restaurant
"BOLHUIS, Mr Hendrik"	Crew	Southampton	Larder Cook	0	27	Male	False	Restaurant
"BOWKER, Miss Ruth Harwood"	Crew	Southampton	Cashier	0	31	Female	True	Restaurant
"CASALI, Sig. Giulio"	Crew	Southampton	Waiter	0	32	Male	False	Restaurant
"CHABOISSON, Mr Adrien Finnin"	Crew	Southampton	Roast Cook	0	25	Male	False	Restaurant
"CORNAIRE, Mr Marcel Raymond AndrÃ©"	Crew	Southampton	Assistant Roast Cook	0	19	Male	False	Restaurant
"COUTIN, Mr Auguste Louis"	Crew	Southampton	Entreï¿½ Cook	0	28	Male	False	Restaurant
"CROVELLA, Sig. Luigi"	Crew	Southampton	Assistant Waiter	0	17	Male	False	Restaurant
"DE MARSICO, Sig. Govanni"	Crew	Southampton	Assistant Waiter	0	20	Male	False	Restaurant
"DEBREUCQ, Mr Maurice Emile Victor"	Crew	Southampton	Assistant Waiter	0	18	Male	False	Restaurant
"DESVERNINE, Mr Louis Gabriel"	Crew	Southampton	Assistant Pastry Cook	0	20	Male	False	Restaurant
"DONATI, Sig. Italo Francesco"	Crew	Southampton	Assistant Waiter	0	17	Male	False	Restaurant
"DORNIER, Mr Louis Auguste"	Crew	Southampton	Assistant Fish Cook	0	20	Male	False	Restaurant
"FEY, Sig. Carlo"	Crew	Southampton	Scullion	0	30	Male	False	Restaurant
"FIORAVANTE, Sig. Giuseppe Bertoldo"	Crew	Southampton	Assistant Scullion	0	23	Male	False	Restaurant
"GATTI, Sig. Gaspare Antonio Pietro"	Crew	Southampton	Ã  la Carte Restaurant Manager	0	37	Male	False	Restaurant
"GILARDINO, Sig. Vincenzo Pio"	Crew	Southampton	Waiter	0	31	Male	False	Restaurant
"GROSCLAUDE, Mr GÃ©rald"	Crew	Southampton	Waiter	0	24	Male	False	Restaurant
"JAILLET, Mr Henri Marie"	Crew	Southampton	Pastry Cook (Restaurant)	0	38	Male	False	Restaurant
"JANIN, Mr Claude Marie"	Crew	Southampton	Soup Cook	0	29	Male	False	Restaurant
"JEFFERY, Mr William Alfred"	Crew	Southampton	A la carte restaurant controller	0	28	Male	False	Restaurant
"JOUANNAULT, Mr Georges Jules"	Crew	Southampton	Assistant Sauce Cook	0	24	Male	False	Restaurant
"MARTIN, Miss Mabel Elvina"	Crew	Southampton	Cashier	0	20	Female	True	Restaurant
"MATTMANN, Sig. Adolf"	Crew	Southampton	Ice Man	0	20	Male	False	Restaurant
"MAUGE, Mr Paul Achille Maurice Germain"	Crew	Southampton	Kitchen Clerk	0	25	Male	True	Restaurant
"MONRÃ³S, Sr. Joan Javier"	Crew	Southampton	Assistant Waiter	0	20	Male	False	Restaurant
"MONTEVERDI, Sig. Giovanni"	Crew	Southampton	Cook	0	23	Male	False	Restaurant
"NANNINI, Sig. Francesco Luigi Arcangelo"	Crew	Southampton	Head Waiter (Restaurant)	0	42	Male	False	Restaurant
"PACHERA, Sig. Jean Baptiste Stanislas"	Crew	Southampton	Assistant Larder Cook	0	19	Male	False	Restaurant
"PEDRINI, Sig. Alessandro"	Crew	Southampton	Assistant Waiter	0	21	Male	False	Restaurant
"PERACCHIO, Sig. Alberto"	Crew	Southampton	Assistant Waiter	0	20	Male	False	Restaurant
"PERACCHIO, Sig. Sebastiano"	Crew	Southampton	Assistant Waiter	0	17	Male	False	Restaurant
"PEROTTI, Sig. Alfonso"	Crew	Southampton	Assistant Waiter	0	20	Male	False	Restaurant
"PHILLIPS, Mr Walter John"	Crew	Southampton	Storekeeper	0	35	Male	False	Restaurant
"PIATTI, Sig. Louis"	Crew	Southampton	Assistant Waiter	0	17	Male	False	Restaurant
"PIAZZA, Sig. Pompeo Gaspro"	Crew	Southampton	Waiter	0	32	Male	False	Restaurant
"POGGI, Sig. Emilio"	Crew	Southampton	Waiter	0	28	Male	False	Restaurant
"PRICE, Mr Ernest Cyril"	Crew	Southampton	Barman	0	17	Male	False	Restaurant
"RATTI, Sig. Enrico"	Crew	Southampton	Waiter	0	21	Male	False	Restaurant
"RICALDONE, Sig. Rinaldo Renato"	Crew	Southampton	Assistant Waiter	0	22	Male	False	Restaurant
"RIGOZZI, Sig. Abele"	Crew	Southampton	Assistant Waiter	0	22	Male	False	Restaurant
"ROTTA, Sig. Angelo Mario"	Crew	Southampton	Waiter	0	23	Male	False	Restaurant
"ROUSSEAU, Mr Pierre"	Crew	Southampton	Chef	0	49	Male	False	Restaurant
"SACCAGGI, Sig. Giovanni Giuseppe Emilio"	Crew	Southampton	Assistant Waiter	0	24	Male	False	Restaurant
"SALUSSOLIA, Sig. Govanni"	Crew	Southampton	Glass Man	0	25	Male	False	Restaurant
"SARTORI, Sig. Lazar"	Crew	Southampton	Assistant Glass Man	0	24	Male	False	Restaurant
"SCAVINO, Sig. Candido"	Crew	Southampton	Carver	0	42	Male	False	Restaurant
"SESIA, Sig. Giacomo"	Crew	Southampton	Waiter	0	24	Male	False	Restaurant
"TESTONI, Sig. Ercole"	Crew	Southampton	Assistant Glass Man	0	23	Male	False	Restaurant
"TIETZ, Sig. Carlo/Karl"	Crew	Southampton	Kitchen Porter	0	27	Male	False	Restaurant
"TURVEY, Mr Charles Thomas"	Crew	Southampton	Page Boy	0	17	Male	False	Restaurant
"URBINI, Sig. Roberto"	Crew	Southampton	Waiter	0	20	Male	False	Restaurant
"VALVASSORI, Sig. Ettore Luigi"	Crew	Southampton	Waiter	0	35	Male	False	Restaurant
"VICAT, Sig. Alphonse Jean Eugene"	Crew	Southampton	Cook	0	21	Male	False	Restaurant
"VILLVARLANGE, Mr Pierre LÃ©on Gabriel"	Crew	Southampton	Assistant Soup Cook	0	19	Male	False	Restaurant
"VINE, Mr Herbert Thomas Gordon"	Crew	Southampton	Assistant Restaurant Controller	0	18	Male	False	Restaurant
"VIONI, Sig. Roberto"	Crew	Southampton	Waiter	0	25	Male	False	Restaurant
"VOEGELIN-DUBACH, Sig. Johannes"	Crew	Southampton	Waiter	0	35	Male	False	Restaurant
"ZANETTI, Sig. Minio"	Crew	Southampton	Assistant Waiter	0	20	Male	False	Restaurant
"ZARRACCHI, Sig. L."	Crew	Southampton	Wine Butler	0	26	Male	False	Restaurant`;
                
                var data = FileAccess.fixUpDatesFromDotNet(sourceData);
                        asyncSuccessCallback(data);
                
                
                // fileAccess.httpReadCsvViaService(fnOrUlr, formatOptions, function (data)
                // {
                //     //---- success ----
                //     if (asyncSuccessCallback)
                //     {
                //         var data = fileAccess.fixUpDatesFromDotNet(data);
                //         asyncSuccessCallback(data);
                //     }
                //     else
                //     {
                //         result = data;
                //     }
                // },
                //     function (e)
                //     {
                //         if (asyncFailCallback)
                //         {
                //             asyncFailCallback(e);
                //         }
                //         else
                //         {
                //             //---- FAILURE ----
                //             fileFail("httpReadCsvViaService", fnOrUlr, e);
                //         }
                //     },
                //     (asyncSuccessCallback != null), asDataFrame);
            }
            else if (format === fileFormat.excelSheet || format === fileFormat.excelAllSheets)
            {
                // fileAccess.httpReadExcelViaService(fnOrUlr, format, <string>formatOptions,
                //     function (data)
                //     {
                //         //---- success ----
                //         if (asyncSuccessCallback)
                //         {
                //             var data = fileAccess.fixUpDatesFromDotNet(data);
                //             asyncSuccessCallback(data);
                //         }
                //         else
                //         {
                //             result = data;
                //         }
                //     },
                //     function (e)
                //     {
                //         //---- failure ----
                //         if (asyncFailCallback)
                //         {
                //             asyncFailCallback(e);
                //         }
                //         else
                //         {
                //             //throw "Error during httpReadCsvViaService: url=" + fnOrUlr + ", error=" + e.response;
                //             fileFail("httpReadCsvViaService", fnOrUlr, e);
                //         }
                //     },
                //     (asyncSuccessCallback != null));
            }
            else
            {
                FileAccess.httpReadViaService(fnOrUlr, isJson, function (data)
                {
                    //---- success ----
                    if (format === fileFormat.odata)
                    {
                        data = data.results;
                    }

                    //---- sending from server encodes special characters, so we must decode them ----
                    data = FileAccess.removeHtmlEncoding(data);

                    //else if (format === fileFormat.csv)
                    //{
                    //    var start = vp.utils.now();

                    //    var csv = createCsvLoader(formatOptions.hasHeader, formatOptions.sepChar,
                    //        formatOptions.findTypes);

                    //    data = csv.load(data, false);

                    //    var data = fileAccess.fixUpDatesFromDotNet(data);

                    //    var elapsed = vp.utils.now() - start;
                    //    vp.utils.debug("csvLoader.load: " + elapsed + " ms");
                    //}

                    if (asDataFrame)
                    {
                        data = DataFrameClass.jsonToDataFrame(data);
                    }

                    if (asyncSuccessCallback)
                    {
                        asyncSuccessCallback(data);
                    }
                    else
                    {
                        result = data;
                    }

                },

                    function (e)
                    {
                        if (asyncFailCallback)
                        {
                            asyncFailCallback(e);
                        }
                        else
                        {
                            //---- failure ----
                            //throw "Error during httpReadCsvViaService: url=" + fnOrUlr + ", error=" + e.response;
                            fileFail("httpReadCsvViaService", fnOrUlr, e);
                        }
                    },
                    (asyncSuccessCallback != null), noCache);
            }

            return result;
        }

        //---- this seems to be the best way to remove HTML encodings from a string (might compress spaces though) ----
        public static removeHtmlEncoding(value: string)
        {
            var div = document.createElement("div");
            div.innerHTML = value;

            var str = div.textContent;
            return str;
        }

        public static readSqlTable(cs: string, tableName: string, query: string, maxRecords: number,
            asyncSuccessCallback?: any, asyncFailCallback?: any)
        {
            var bpServer = bpServerPath();
            var serviceUrl = bpServer + "/getData.asmx/DownloadDataFromSql";

            var fullUrl = serviceUrl + "?cs=" + cs + "&tableName=" + tableName + "&query=" + query + "&maxRecords=" +
                maxRecords;

            var finalUrl = encodeURI(fullUrl);

            var isJson = true;
            httpRead(finalUrl, isJson, function (xmlhttp)
            {
                if (asyncSuccessCallback)
                {
                    var data = getDataFromResult(xmlhttp, isJson);

                    ////---- convert into a real dataFrame object ----
                    //var df = new dataFrameClass(data.names, data.vectors);

                    data = FileAccess.fixUpDatesFromDotNet(data);

                    asyncSuccessCallback(data);
                }
            },
            asyncFailCallback, true);
        }

        static httpReadIncremental(url, isJson, offset, maxSize, successFunc, failFunc, callAsync?)
        {
            var pp = pagePath();

            if (url.startsWith(".."))
            {
                url = pp + url;
            }

            //var serviceUrl = "http://" + window.location.host + "/VuePlotWeb/Service/Service1.asmx/DownloadText";
            var serviceUrl = pp + "/Service/Service1.asmx/IncrementalDownload";

            var win: any = window;

            if (win.alertShown === undefined || win.alertShown === null)
            {
                //alert("read via url: " + serviceUrl);
                win.alertShown = 1;
            }

            var fullUrl = serviceUrl + "?url=" + url + "&offset=" + offset + "&maxSize=" + maxSize;

            httpRead(fullUrl, false, function (xmlhttp)
            {
                if (successFunc)
                {
                    var data = getDataFromResult(xmlhttp, isJson);

                    successFunc(data);
                }
            },
                failFunc);
        }

        /// starts a async (or calls sync) upload of text to the specified url.
        static httpPost(url, stringToSend, successFunc, failFunc?: any, isAsync?: boolean, contentType?: string)
        {
            var xmlhttp = createXMLHttpRequest();
            xmlhttp.open("POST", url, isAsync);

            if (!contentType)
            {
                contentType = "application/x-www-form-urlencoded";
            }

            xmlhttp.setRequestHeader("Content-Type", contentType);

            xmlhttp.onreadystatechange = function ()
            {
                if ((xmlhttp.readyState === 4) && (xmlhttp.status !== 0))
                {
                    if (xmlhttp.status === 200)
                    {
                        if (successFunc != null)
                        {
                            successFunc(xmlhttp);
                        }
                    }
                    else
                    {
                        if (failFunc != null)
                        {
                            failFunc(xmlhttp);
                        }
                    }
                }
            };

            xmlhttp.send(stringToSend);
        }

        ///
        /// download text data from a URL, using a specific service that is expected to
        /// be on the same host as the current host:  http://samehostname/VuePlotWeb/Service/Service1.asmx/DownloadText
        ///
        /// This is to get around problem "cross origin resource sharing".
        ///
        static httpReadViaService(url: string, isJson: boolean, successFunc: any, failFunc?: any, isAsync?: boolean, noCache?: boolean)
        {
            isJson = isJson || false;
            noCache = noCache || false;

            var win: any = window;
            if (win.alertShown === undefined || win.alertShown === null)
            {
                //alert("read via url: " + serviceUrl);
                win.alertShown = 1;
            }

            successFunc({
                "State": ["NY"],
                "Name": ["Hello World!"]
            });

//             httpRead(finalUrl, httpReadJson, function (xmlhttp)
//             {
//                 if (successFunc)
//                 {
//                     var data = getDataFromResult(xmlhttp, isJson, true);
// 
//                     successFunc(data);
//                 }
//             },
//                 failFunc, isAsync, noCache);
        }

        ///
        /// download CSV data (as JSON data) from a URL, using a specific service that is expected to
        /// be on the same host as the current host:  http://samehostname/VuePlotWeb/Service/Service1.asmx/DownloadCsvAsJson
        ///
        /// This is to get around problem "cross origin resource sharing".
        ///
        static httpReadCsvViaService(url: string, csvOpts: CsvFormatOptions, successFunc, failFunc?, isAsync?: boolean, asDataFrame = false)
        {
            var vp = bpServerPath();
            var serviceUrl = vp + "/getData.asmx/DownloadCsvAsJsonVectors";

            var win: any = window;
            if (win.alertShown === undefined || win.alertShown === null)
            {
                //alert("read via url: " + serviceUrl);
                win.alertShown = 1;
            }

            var fullUrl = serviceUrl + "?url=" + url + "&delimeter=" + csvOpts.sepChar +
                "&hasHeader=" + csvOpts.hasHeader + "&inferTypes=" + csvOpts.findTypes;

            var finalUrl = encodeURI(fullUrl);

            var isJson = true;
            httpRead(finalUrl, isJson, function (xmlhttp)
            {
                if (successFunc)
                {
                    var data = getDataFromResult(xmlhttp, isJson);

                    if (asDataFrame)
                    {
                        //---- convert into a real dataFrame object ----
                        var df = new DataFrameClass(data.names, data.vectors);
                        data = df;
                    }

                    data = FileAccess.fixUpDatesFromDotNet(data);

                    successFunc(data);
                }
            },
                failFunc, isAsync);
        }

        ///
        /// download Excel data (as JSON data) from a URL, using a specific service that is expected to
        /// be on the same host as the current host:  http://samehostname/VuePlotWeb/Service/Service1.asmx/DownloadExcelAsJson
        ///
        /// This is to get around problem "cross origin resource sharing".
        ///
        static httpReadExcelViaService(url: string, format: fileFormat, sheetName: string, successFunc, failFunc?, isAsync?)
        {
            var vp = bpServerPath();

            if (format === fileFormat.excelSheet)
            {
                var serviceUrl = vp + "/getData.asmx/DownloadExcelSheetAsJson";
                var fullUrl = serviceUrl + "?url=" + url + "&sheetName=" + sheetName;
            }
            else
            {
                var serviceUrl = vp + "/getData.asmx/DownloadAllExcelSheetsAsJson";
                var fullUrl = serviceUrl + "?url=" + url;
            }

            var win: any = window;
            if (win.alertShown === undefined || win.alertShown === null)
            {
                //alert("read via url: " + serviceUrl);
                win.alertShown = 1;
            }

            var finalUrl = encodeURI(fullUrl);

            var isJson = true;
            httpRead(finalUrl, isJson, function (xmlhttp)
            {
                if (successFunc)
                {
                    var data = getDataFromResult(xmlhttp, isJson);

                    successFunc(data);
                }
            },
                failFunc, isAsync);
        }

        /// reads OData data from the specified url.
        static oDataRead(url, isJson, successFunc, failFunc)
        {
            FileAccess.httpReadViaService(url, isJson, function (data)
            {
                if (successFunc)
                {
                    if ((data) && (data.results))
                    {
                        data = data.results;
                    }

                    successFunc(data);
                }
            }, failFunc);
        }

        //---- we use this to store data for multiple calls to oDataReadAll ----
        static oDataBag: any = {};

        /// reads all of the OData data from the specified url (adding parameters to the URL to
        /// read each block of data).
        static oDataReadAll(url, byCount, successFunc, failFunc)
        {
            if (byCount == null)
            {
                byCount = 1000;
            }

            var bag = FileAccess.oDataBag;
            bag.error = false;
            bag.data = [];
            bag.total = 0;
            bag.byCount = byCount;

            var readMore = function ()
            {
                FileAccess.oDataRead(url + "?$skip=" + bag.total + "&$top=" + bag.byCount, true,

                    function (dataChunk)     // success func
                    {
                        var chunkSize = dataChunk.length;
                        if (chunkSize > 0)
                        {
                            bag.byCount = chunkSize;

                            //self.dataServices.concat(dataChunk);
                            //bag.data = dataServices.conconcat(bag.data, dataChunk);

                            bag.total = bag.data.length;

                            readMore();
                        }
                        else
                        {
                            if (successFunc != null)
                            {
                                successFunc(bag.data);
                            }
                        }
                    },

                    function (xmlhttp)      // failure func
                    {
                        if (failFunc != null)
                        {
                            failFunc(xmlhttp);
                        }

                        bag.error = true;
                    }
                    );
            };

            readMore();
        }

    }

    export class IncrementalCsvLoader
    {
        _csvLoader = null;
        _offset = 0;
        _recordsCallback = null;
        _url = null;

        constructor(url, hasHeader, sepChar, findTypes, recordsCallback)
        {
            this._recordsCallback = recordsCallback;
            this._url = url;

            this._csvLoader = createCsvLoader(hasHeader, sepChar, findTypes);
        }

        public readNextCheck(size)
        {
            FileAccess.httpReadIncremental(this._url, false, this._offset, size, function (jsonResult)
            {
                //---- success: got next chunk ----
                var chunk = jsonResult.data;
                var isMore = jsonResult.isMore;

                this._offset += chunk.length;

                var records = this._csvLoader.load(chunk, true);
                this._recordsCallback(records, isMore);
            }, function (xmlhttp)
                {
                    //---- read failed ----
                    throw "Error reading CSV file: " + this._url;
                });
        }
    }

    export function pagePath()
    {
        var pp = window.location.href;

        //---- on IE10, running under "localhost", sometimes all the props of "window.location" are ----
        //---- undefined, so we ahndle that here ----
        if (pp === undefined || pp === null)
        {
            pp = window.location.toString();
        }

        var index = pp.lastIndexOf("/");
        if (index > 0)
        {
            pp = pp.substr(0, index);
            index = pp.lastIndexOf("/");
            if (index > 0)
            {
                pp = pp.substr(0, index);
            }
        }

        return pp;
    }

    /// starts a async download of text from the specified url.  if "isJson" is true,
    /// the data is requested in json format.  when the download is finished, either
    /// successFunc or failFunc is called, with the param "xmlhttp".
    ///
    /// if this is a file on a server, the true text is returned in xmlhttp.responseText.  if text is XML,
    /// the XML document object is available in xmlhttp.responseXML.
    export function httpRead(url: string, isJson: boolean, successFunc, failFunc, callAsync?: boolean, noCache?: boolean)
    {
        callAsync = (callAsync === undefined || callAsync === null) ? true : callAsync;

        var xmlhttp = vp.utils.createXMLHttpRequest();
        xmlhttp.open("GET", url, callAsync);

        if (isJson)
        {
            xmlhttp.setRequestHeader("accept", "application/json");
        }

        if (noCache)
        {
            xmlhttp.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2005 00:00:00 GMT");
        }

        xmlhttp.onreadystatechange = function ()
        {
            if ((xmlhttp.readyState === 4) && (xmlhttp.status !== 0))
            {
                if (xmlhttp.status === 200)
                {
                    if (successFunc != null)
                    {
                        successFunc(xmlhttp);
                    }
                }
                else
                {
                    if (failFunc != null)
                    {
                        failFunc(xmlhttp);
                    }
                    else
                    {
                        throw "httpRead failed: url=" + url;
                    }
                }
            }
        };

        xmlhttp.send();
    }

    export function getMyPath()
    {
        // if (AppMgrClass.current && AppMgrClass.current._beachPartyDir)
        // {
        //     var path = <string>AppMgrClass.current._beachPartyDir + "/Apps";
        // }
        // else
        // {
            var path = window.location.href;

            //---- remove any params ----
            var index = path.indexOf("?");
            if (index > -1)
            {
                path = path.substr(0, index);
            }

            //---- remove the last node ----
            var index = path.lastIndexOf("/");
            if (index > -1)
            {
                path = path.substr(0, index);
            }
        // }

        return path;
    }

    function pathHelper(nodeName)
    {
        var serverPath = window.location.href;

        //---- try easy one first ----
        if (serverPath.startsWith("http://localhost"))
        {
            serverPath = "http://localhost/" + nodeName;
        }
        else
        {
            //---- first, remove any parameters ----
            var index = serverPath.indexOf("?");
            if (index > -1)
            {
                serverPath = serverPath.substr(0, index);
            }

            //---- find node that begins with "/build" ----
            index = serverPath.indexOf("/build");
            if (index > 0)
            {
                var index2 = serverPath.indexOf("/", index + 1);
                if (index2 > -1)
                {
                    serverPath = serverPath.substr(0, index2);
                    serverPath += "/" + nodeName;
                }
            }
        }

        return serverPath;
    }

    export function bpServerPath()
    {
        ////---- on IE10, running under "localhost", sometimes all the props of "window.location" are ----
        ////---- undefined, so we handle that here ----

        //---- the GOAL of this function: to return the "bpServer" name that belongs to this code.  This is easy ----
        //---- for dev machine (http://localhost/bpServer) but gets somewhat tricky when we are deployed ----
        //---- and the bpServer we want is something like:  http://vibe10/SandCastle/build3/bpServer.  ----

        var path = null;
        var serverPath = window.location.href;

        if (serverPath.contains("azurewebsites.net"))
        {
            path = "http://beachpartyserver.azurewebsites.net";
        }
        else
        {
            path = pathHelper("bpServer");
        }

        return path;
    }

    export function appPath()
    {
        ////---- on IE10, running under "localhost", sometimes all the props of "window.location" are ----
        ////---- undefined, so we handle that here ----

        //---- the GOAL of this function: to return the "bpServer" name that belongs to this code.  This is easy ----
        //---- for dev machine (http://localhost/bpServer) but gets somewhat tricky when we are deployed ----
        //---- and the bpServer we want is something like:  http://vibe10/SandCastle/build3/bpServer.  ----

        // if (AppMgrClass.current && AppMgrClass.current._beachPartyDir)
        // {
        //     var path = <string>AppMgrClass.current._beachPartyDir;
        // }
        // else
        // {
            var path = pathHelper("beachPartyApp");
        // } 

        return path; 
    }

    export function bpDataPath()
    {
        //return pathHelper("VueBigData");
        var hostName = (window.location.hostname) ? window.location.hostname : "localhost";

        var dataPath = "http://" + hostName + "/VueBigData";
        return dataPath;
    }

    /// create a instance of the XMLHttpRequest object.
    export function createXMLHttpRequest()
    {
        var req = null;

        if (XMLHttpRequest != null)
        {
            req = new XMLHttpRequest();
        }
        else
        {
            req = new ActiveXObject("Microsoft.XMLHTTP");
        }

        return req;
    }

    /// convert a XmlHttp response to a json object.
    export function getDataFromResult(xmlRequest: XMLHttpRequest, isJson: boolean, decodeNeeded?: boolean)
    {
        //---- try not to use the "responseXML" since it is heavy weight ----
        var data: any = xmlRequest.response;        // on my server, value is here
        if (!data)
        {
            data = xmlRequest.responseText;         // on vibe10, value is here.  why?
        }

        if (data)
        {
            if (data.startsWith("<?xml"))
            {
                var index = data.indexOf(">");
                if (index > -1)
                {
                    var index2 = data.indexOf(">", index + 1);
                    if (index2 > -1)
                    {
                        //---- remove the XML header ----
                        data = data.substr(index2 + 1);

                        //---- remove the xml trailer ----
                        if (data.endsWith("</string>"))
                        {
                            data = data.substr(0, data.length - 9);
                        }
                    }
                }
            }
            //var responseXML: any = xmlRequest.responseXML;

            //var node = responseXML.lastChild;
            //if (node)
            //{
            //    data = (node.text) ? node.text : node.textContent;
            //}

            //---- convert from XML string to the actual value we want ----
        }

        ////---- TOGROK: what is this needed? ----
        //if (decodeNeeded)
        //{
        //    data = decodeURIComponent(data);
        //    data = decodeURIComponent(data);
        //}

        if ((data) && (isJson))
        {
            vp.utils.debug("getDataFromResult: json.length=" + vp.formatters.comma(data.length));

            var data = JSON.parse(data);
            if ((data) && (data.d))
            {
                data = data.d;      // for json data
            }
        }

        return data;
    }

    export function startServerSort(keys: string[], sortAsNumbers: boolean, callback)
    {
        var jsonData = JSON.stringify(keys);
        var safeJsonData = encodeURIComponent(jsonData);         // protect ourselves from "=" and "&" chars in keys

        var body = "sortAsNumbers=" + sortAsNumbers + "&keys=" + safeJsonData;

        var url = bpServerPath() + "/putData.asmx/sortKeys";
        var safeUrl = encodeURI(url);

        FileAccess.httpPost(safeUrl, body, function (xmlhttp)
        {
            //---- SUCCESS ----
            var data = getDataFromResult(xmlhttp, true);
            callback(data);
        },
            function (e)
            {
                //alert("writeFile64 failed");
            }, false);
    }

    export function logActionToServer(sessionId: string, gesture: string, elementId: string, elementType: string,
        action: string, target: string, name1?: string, value1?: string, name2?: string, value2?: string,
        name3?: string, value3?: string, name4?: string, value4?: string)
    {
        var url = bpServerPath() + "/putData.asmx/logAction";

        url += "?sessionId=" + sessionId +
            "&gesture=" + gesture +
            "&elementId=" + elementId +
            "&elementType=" + elementType +
            "&action=" + action +
            "&target=" + target +
            "&name1=" + name1 +
            "&value1=" + value1 +
            "&name2=" + name2 +
            "&value2=" + value2 +
            "&name3=" + name3 +
            "&value3=" + value3 +
            "&name4=" + name4 +
            "&value4=" + value4;
        
        //action + " & actionSource = " + actionSource + " & p1 = " + p1 + " & p2 = " + p2 + " & p3 = " + p3;
//         var safeUrl = encodeURI(url);
// 
//         beachParty.httpRead(safeUrl, false, 
//             function (xmlhttp)
//             {
//                 //---- SUCCESS ----
//             },
//             function (e)
//             {
//                 //---- FAILURE ----
//                 //fileFail("logActionToServer", "", e);
//             }, true);
    }

    export function logFeedbackToServer(type: string, feedback: string)
    {
        var url = bpServerPath() + "/putData.asmx/logFeedback";

        //---- use "encodeURI" for the overall URL, if needed ----
        //---- use "encodeURIComponent" for the values of parameters, if needed ---
        url += "?type=" + type + "&feedback=" + encodeURIComponent(feedback);
        
        beachParty.httpRead(url, false,
            function (xmlhttp)
            {},
            function (e)
            {
                this.fileFail("logFeedbackToServer", "", e);
            }, true);
    }

    function fileFail(callerName, url, e)
    {
        throw "Error in " + callerName + ", status=" + e.statusText + "\r\nurl=" + url + "\r\n" + e.responseText;
    }

    export function renderWebPageToPng(pageUrl: string, width: number, height: number, msTimeout: number, callback)
    {
        var url = bpServerPath() + "/putData.asmx/renderWebPageToPng";

        //---- use "encodeURI" for the overall URL, if needed ----
        //---- use "encodeURIComponent" for the values of parameters, if needed ---

        //---- todo: also pass preload ----
        url += "?pageUrl=" + encodeURIComponent(pageUrl) + "&width=" + width + "&height=" + height + "&msTimeout=" + msTimeout;

        beachParty.httpRead(url, false,
            function (xmlhttp)
            {
                //---- SUCCESS ----
                var data = getDataFromResult(xmlhttp, false);
                callback(data);
            },
            function (e)
            {
                //---- FAILURE ----
                fileFail("renderWebPageToPng", pageUrl, e);
            }, true);
    }

    export function writeSessionFile(userName: string, fileName: string, contents: string, callback)
    {
        var body = "userName=" + userName + "&fileName=" + fileName + "&contents=" + contents;
        var safeBody = encodeURIComponent(body);

        var url = bpServerPath() + "/putData.asmx/writeSessionFile";
        var safeUrl = encodeURI(url);

        FileAccess.httpPost(safeUrl, safeBody,
            function (xmlhttp)
            {
                //---- SUCCESS ----
                var data = getDataFromResult(xmlhttp, false);
                callback(data);
            },
            function (e)
            {
                //---- FAILURE ----
                fileFail("writeSessionFile", fileName, e);
            }, true);
    }

    export function readSessionFile(sessionUrl: string, callback)
    {
        var url = bpServerPath() + "/putData.asmx/readSessionFile?sessionUrl=" + sessionUrl;
        //var safeUrl = encodeURI(url);

        var async = true;

        httpRead(url, false, 
            function (xmlhttp)
            {
                //---- SUCCESS (get as raw string, not JSON) ----
                var text = getDataFromResult(xmlhttp, false);

                if (callback)
                {
                    callback(text);
                }
            },
            function (e)
            {
                //---- FAILURE ----
                //throw "readSessionFile: error=" + e.response;
                fileFail("readSessionFile", sessionUrl, e);
            }, async);
    }

    //export function publishAppStateToFile(appStateString: string, callback)
    //{
    //    var safeAppState = encodeURIComponent(appStateString);

    //    var body = "appState=" + safeAppState;

    //    var url = bpServerPath() + "/putData.asmx/publishAppStateToFile";
    //    var safeUrl = encodeURI(url);

    //    fileAccess.httpPost(safeUrl, body, function (xmlhttp)
    //    {
    //        //---- SUCCESS ----
    //        var data = getDataFromResult(xmlhttp, true);
    //        callback(data);
    //    },
    //        function (e)
    //        {
    //            throw "publishAppStateToFile: error=" + e.response;
    //        }, true);
    //}

    //export function getAppStateFromFile(userFn: string, callback?: any): string
    //{
    //    var safeAppState = encodeURIComponent(userFn);
    //    var str = null;
    //    var url = bpServerPath() + "/getData.asmx/GetAppStateFromFile?userFn=" + safeAppState;
    //    var safeUrl = encodeURI(url);

    //    var httpReadJson = false;       // download to us as text
    //    var async = (callback != null);

    //    httpRead(safeUrl, true,
    //        function (xmlhttp)
    //        {
    //            //---- SUCCESS (get as raw string, not JSON) ----
    //            str = getDataFromResult(xmlhttp, false);

    //            if (callback)
    //            {
    //                callback(str);
    //            }
    //        },
    //        function (e)
    //        {
    //            throw "getAppStateFromFile: error=" + e.response;
    //        }, async);

    //    return str;
    //}

}