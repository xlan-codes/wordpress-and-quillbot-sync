import { IsNull } from 'typeorm';
import WPAPI, { WPAPIOptions } from 'wpapi';
import axios from 'axios';
import { Article } from './entities/article.entity';
import { AppDataSource } from './data-source';
import { Category } from './entities/category.entity';
import { QuillBot } from './quillbot';

export class SyncService {
    private bot: QuillBot;
    constructor(quillBot: QuillBot) {
        this.bot = quillBot;
    }

    public capitalizeFirstLetter(string: String) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    public async createParentCategory(): Promise<void> {
        try {
            const categoryRepository = (await AppDataSource).getRepository(Category);
            const wordpress = await this.getWordpressConnection();
            const categories = await categoryRepository.find({
                where: {
                    parentCategory: IsNull()
                }
            });
            for (let element of categories) {
                let wpCategory;
                try {
                    wpCategory = await wordpress.categories().create({
                        name: element.categoryName,
                        slug: element.categoryName?.toLowerCase().replace(' ', '-'),
                    });
                } catch (error) {
                    let err = error as any;
                    if (err.code === 'term_exists') {
                        wpCategory = {
                            id: err.data.term_id
                        }
                    }
                }

                await this.createCityCategory(element.id as number, wpCategory.id, element.categoryName as string);
                await categoryRepository.update(element.id as number, {
                    synced: true
                })
            }
        } catch (error) {
            console.log(error)
        }

    }

    public async createCityCategory(parentId: number, wordpressCategoryParent: number, region: string): Promise<void> {
        const categoryRepository = (await AppDataSource).getRepository(Category);
        const wordpress = await this.getWordpressConnection();
        const categories = await categoryRepository.find({
            where: {
                parentCategory: parentId
            }
        });
        for (let element of categories) {
            let wpCategory;
            try {
                wpCategory = await wordpress.categories().create({
                    name: element.categoryName,
                    slug: element.categoryName?.toLowerCase().replace(' ', '-'),
                    parent: wordpressCategoryParent
                });
            } catch (error) {
                let err = error as any;
                if (err.code === 'term_exists') {
                    wpCategory = {
                        id: err.data.term_id
                    }
                }
            }
            await this.createChildCategory(element.id as number, wpCategory.id, wordpressCategoryParent, wpCategory.id, region, element.categoryName as string);
            await categoryRepository.update(element.id as number, {
                synced: true
            })
        }
    }

    public async createChildCategory(parentId: number, wordpressCategoryParent: number, region: number, city: number, regionName: string, cityName: string): Promise<void> {
        const categoryRepository = (await AppDataSource).getRepository(Category);
        const wordpress = await this.getWordpressConnection();
        const categories = await categoryRepository.find({
            where: {
                parentCategory: parentId
            }
        });
        for (let element of categories) {
            let wpCategory;
            try {
                wpCategory = await wordpress.categories().create({
                    name: element.categoryName,
                    slug: element.categoryName?.toLowerCase().replace(' ', '-'),
                    parent: wordpressCategoryParent
                });
            } catch (error) {
                let err = error as any;
                if (err.code === 'term_exists') {
                    wpCategory = {
                        id: err.data.term_id
                    }
                }
            }
            await this.createChildChildCategory(element.id as number, wpCategory.id, region, city, wpCategory.id, regionName, cityName, element.categoryName as string);
            await categoryRepository.update(element.id as number, {
                synced: true
            })
        }
    }

    public async createChildChildCategory(parentId: number, wordpressCategoryParent: number, region: number, city: number, categoryId: number, regionName: string, cityName: string, categoryName: string): Promise<void> {
        const categoryRepository = (await AppDataSource).getRepository(Category);
        const wordpress = await this.getWordpressConnection();
        const categories = await categoryRepository.find({
            where: {
                parentCategory: parentId
            }
        });
        for (let element of categories) {
            let wpCategory;
            try {
                wpCategory = await wordpress.categories().create({
                    name: element.categoryName,
                    slug: element.categoryName?.toLowerCase().replace(' ', '-'),
                    parent: wordpressCategoryParent
                });
            } catch (error) {
                let err = error as any;
                if (err.code === 'term_exists') {
                    wpCategory = {
                        id: err.data.term_id
                    }
                }
            }
            await categoryRepository.update(element.id as number, {
                synced: true
            });

            await this.createArticleWithCategories(element.id as number, wpCategory.id, categoryId, city, region, regionName, cityName, categoryName, element.categoryName as string);
        }
    }

    public async createArticleWithCategories(localCategoryId: number, categoryId: number, category: number, city: number, region: number, regionName: string, cityName: string, categoryName: string, categoryChild: string): Promise<void> {

        const wordpress = await this.getWordpressConnection();

        const articleRepository = (await AppDataSource).getRepository(Article)

        const articles: Array<Article> | null = await articleRepository.find({
            where: {
                categoryId: localCategoryId
            },
            take: 3
        });
        console.log(articles.length);
        const date = new Date();
        let articleContent = '';

        let titles = '';

        for (let art of articles) {
            const res = await axios.get(art.img, { responseType: 'arraybuffer' })
            const buffer = Buffer.from(res.data, "utf-8") as any;
            let media = await wordpress.media()
                // Specify a path to the file you want to upload, or a Buffer
                .file(buffer, art.title?.toLowerCase().replace(' ', '-') + '.jpg')
                .create({
                    title: '',
                    alt_text: '',
                    caption: '',
                    description: ''
                });

            // const description = art.descript.replace('Here’s The Deal:', '');
            const description = await this.bot.paraphrase(art.descript.replace('Here’s The Deal:', ''));
            console.log("test -> ", description);
            let separator = '';
            if (titles !== '')
                separator = ", ";
            titles += (separator + art.title);

            articleContent += `

                        <!-- wp:heading {"level":3} -->
                        <h3>1. <strong>${art.title}</strong></h3>
                        <!-- /wp:heading -->

                        <!-- wp:columns -->
                        <div class="wp-block-columns">
                        <!-- wp:column {"verticalAlignment":"top"} -->
                        <div class="wp-block-column is-vertically-aligned-top">
                            <!-- wp:image {"id":332,"width":520,"height":372,"sizeSlug":"full","linkDestination":"none"} -->
                            <figure class="wp-block-image size-full is-resized"><img src="${media.source_url}" alt="" class="wp-image-332" width="520" height="372"/></figure>
                            <!-- /wp:image -->
                        </div>
                        <!-- /wp:column -->
                        <!-- wp:column -->
                        <div class="wp-block-column">
                            <!-- wp:paragraph {"align":"left"} -->
                            <p class="has-text-align-left">⭐⭐⭐⭐⭐<br><strong>Address:</strong> <a rel="noreferrer noopener" href="${art.location}" target="_blank">${art.address} </a><br>
                            <strong>Phone Number:</strong> 
                            <a href="tel:${art.phone}">${art.phone?.replace("tel:", "")}</a><br>
                            ${/*art.website ? '<strong>Website:</strong> <a href="'+art.website+'">'+art.website+'</a><br>' : '' */ ''}
                            </p>
                            <!-- /wp:paragraph -->
                        </div>
                        <!-- /wp:column -->
                        </div>
                        <!-- /wp:columns -->

                        <!-- wp:columns -->
                        <div class="wp-block-columns">
                        <!-- wp:column -->
                        <div class="wp-block-column">
                            <!-- wp:paragraph -->
                            <p>${"<strong>So Here's The Deal:<br></strong>"}${description}</p>
                            <!-- /wp:paragraph -->
                        </div>
                        <!-- /wp:column -->
                        <!-- wp:column -->
                        <div class="wp-block-column">
                            <!-- wp:columns {"verticalAlignment":"top"} -->
                            <div class="wp-block-columns are-vertically-aligned-top">
                                <!-- wp:column {"verticalAlignment":"top"} -->
                                <div class="wp-block-column is-vertically-aligned-top">
                                    <!-- wp:buttons -->
                                    <div class="wp-block-buttons">
                                    <!-- wp:button {"backgroundColor":"black","width":100} -->
                                    <div class="wp-block-button has-custom-width wp-block-button__width-100"><a href="${art.phone}" class="wp-block-button__link has-black-background-color has-background">Call</a></div>
                                    <!-- /wp:button -->
                                    </div>
                                    <!-- /wp:buttons -->
                                </div>
                                <!-- /wp:column -->
                                <!-- wp:column {"verticalAlignment":"top"} -->
                                <div class="wp-block-column is-vertically-aligned-top">
                                    <!-- wp:buttons -->
                                    <div class="wp-block-buttons">
                                    <!-- wp:button {"backgroundColor":"black","width":100} -->
                                    <div class="wp-block-button has-custom-width wp-block-button__width-100"><a class="wp-block-button__link has-black-background-color has-background" href="email:${art.email}">Email</a></div>
                                    <!-- /wp:button -->
                                    </div>
                                    <!-- /wp:buttons -->
                                </div>
                                <!-- /wp:column -->
                            </div>
                            <!-- /wp:columns -->
                            <!-- wp:html -->
                            <div class="mapouter">
                            <div class="gmap_canvas"><iframe width="600" height="450" id="gmap_canvas"
                                    src="https://maps.google.com/maps?q=${art.address?.replace(" ", "%20")}&t=&z=13&ie=UTF8&iwloc=&output=embed"
                                    frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe><a
                                    href="https://123movies-to.org"></a><br>
                                <style>
                                    .mapouter {
                                        position: relative;
                                        text-align: right;
                                        height: 450px;
                                        width: 450px;
                                    }
                                </style><a href="https://www.embedgooglemap.net">embed google maps in web page</a>
                                <style>
                                    .gmap_canvas {
                                        overflow: hidden;
                                        background: none !important;
                                        height: 350px;
                                        width: 350px;
                                    }
                                </style>
                            </div>
                        </div>
                            
                            <!-- /wp:html -->
                        </div>
                        <!-- /wp:column -->
                        </div>

                        <!-- /wp:columns -->
            `
        }
        console.log(
            'final article'
        );
        const finalArticle = `
                        <!-- wp:paragraph -->
                        <p>Top 3 ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}. All of our ${categoryChild} actually face a rigorous 50-Point Inspection, which includes customer reviews, history, complaints, ratings, satisfaction, trust, cost and general excellence. You deserve only the best!</p>
                        <!-- /wp:paragraph -->
                        <!-- wp:heading -->
                        <h2><strong>Top Rated ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}</strong></h2>
                        <!-- /wp:heading -->
                        <!-- wp:paragraph -->
                        <p>We have listed below the top rated ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}:</p>
                        <!-- /wp:paragraph -->
                        <!-- wp:list -->

                ${articleContent}


                <!-- wp:heading -->
                <h2><strong>${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} FAQs</strong></h2>
                <!-- /wp:heading -->
                
                <!-- wp:yoast/faq-block {"questions":[{"id":"faq-question-1666519284176","question":["Which are the best ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}?"],"answer":["Our research shows that the top local ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} are ${titles}."],"jsonQuestion":"Which are the best ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}?","jsonAnswer":"Our research shows that the top local ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} are  ${titles}."},{"id":"faq-question-1666519314201","question":["How To Choose a ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}?"],"answer":["The first step to selecting a company is to decide if a national or local business is going to be better for you. As illustrated above, different types of ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} are suited for different sorts of moves. You also will need to determine if you want a full-service ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}. The type of local ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} that is best for you will depend on your budget and how badly you want to avoid packing boxes. Some good ways to learn about a company's reputation are through online reviews and the BBB. You may also want to know which ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} licensing requirements. All of the companies on our list of ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} are well-reviewed and selected by our expert team. Once you've narrowed down your list, you can begin talking to ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}. It is strongly suggested that you speak with at least two of the ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} on our list and inquire about getting more information. Make sure that you inform them of all of the services you may need."],"jsonQuestion":"How To Choose a ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}?","jsonAnswer":"The first step to selecting a company is to decide if a national or local business is going to be better for you. As illustrated above, different types of ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} are suited for different sorts of moves. You also will need to determine if you want a full-service ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}. The type of local ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} that is best for you will depend on your budget and how badly you want to avoid packing boxes. Some good ways to learn about a company's reputation are through online reviews and the BBB. You may also want to know which ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} licensing requirements. All of the companies on our list of ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} are well-reviewed and selected by our expert team. Once you've narrowed down your list, you can begin talking to ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}. It is strongly suggested that you speak with at least two of the ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} on our list and inquire about getting more information. Make sure that you inform them of all of the services you may need."},{"id":"faq-question-1666519348927","question":["How much do ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} cost?"],"answer":["Cost is an important consideration when choosing ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}, especially in a city like this which has many great choices."],"jsonQuestion":"How much do ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} cost?","jsonAnswer":"Cost is an important consideration when choosing ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}, especially in a city like this which has many great choices."},{"id":"faq-question-1666519365759","question":["How can I reach ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}?"],"answer":["You can call the best ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} by the number that is mentioned on their listing above."],"jsonQuestion":"How can I reach ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}?","jsonAnswer":"You can call the best ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} by the number that is mentioned on their listing above."},{"id":"faq-question-1666519373749","question":["How do we select the best ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}?"],"answer":["Our team goes and reviews every local business in the area and based on the reviews and their online presence we pick three best of ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}."],"jsonQuestion":"How do we select the best ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}?","jsonAnswer":"Our team goes and reviews every local business in the area and based on the reviews and their online presence we pick three best of ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}."}]} -->
                <div class="schema-faq wp-block-yoast-faq-block">
                    <div class="schema-faq-section" id="faq-question-1666519284176"><strong class="schema-faq-question">Which are the
                            best ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}?</strong>
                        <p class="schema-faq-answer">Our research shows that the top local ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} are  ${titles}.</p>
                    </div>
                    <div class="schema-faq-section" id="faq-question-1666519314201"><strong class="schema-faq-question">How To Choose a
                            ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}?</strong>
                        <p class="schema-faq-answer">The first step to selecting a company is to decide if a national or local business
                            is going to be better for you. As illustrated above, different types of ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} are suited for different
                            sorts of moves. You also will need to determine if you want a full-service ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}. The type of local
                            ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} that is best for you will depend on your budget and how badly you want to avoid packing boxes.
                            Some good ways to learn about a company's reputation are through online reviews and the BBB. You may also
                            want to know which ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} licensing requirements. All of the companies on our list of ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} are
                            well-reviewed and selected by our expert team. Once you've narrowed down your list, you can begin talking to
                            ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}. It is strongly suggested that you speak with at least two of the ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} on our list and
                            inquire about getting more information. Make sure that you inform them of all of the services you may need.
                        </p>
                    </div>
                    <div class="schema-faq-section" id="faq-question-1666519348927"><strong class="schema-faq-question">How much do
                            ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} cost?</strong>
                        <p class="schema-faq-answer">Cost is an important consideration when choosing ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}, especially in a city
                            like this which has many great choices.</p>
                    </div>
                    <div class="schema-faq-section" id="faq-question-1666519365759"><strong class="schema-faq-question">How can I reach
                            ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}?</strong>
                        <p class="schema-faq-answer">You can call the best ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)} by the number that is mentioned on their listing
                            above.</p>
                    </div>
                    <div class="schema-faq-section" id="faq-question-1666519373749"><strong class="schema-faq-question">How do we select
                            the best ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}?</strong>
                        <p class="schema-faq-answer">Our team goes and reviews every local business in the area and based on the reviews
                            and their online presence we pick three best of ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}.</p>
                    </div>
                </div>
                <!-- /wp:yoast/faq-block -->
        `;


        console.log('create article');
        const response = await wordpress.posts().create({
            title: `3 Best ${this.capitalizeFirstLetter(categoryChild)} in ${this.capitalizeFirstLetter(cityName)}, ${this.capitalizeFirstLetter(regionName)}`,
            content: finalArticle,
            tags: [],
            //   featured_media: media.id,
            slug: `three-best-${categoryChild}-in-${cityName}-${regionName}`,
            categories: [categoryId, category, city, region],
            status: 'publish'
        });
        console.log('end create article')
    }

    private async getWordpressConnection(): Promise<WPAPI> {
        var wp = new WPAPI({
            endpoint: 'https://3bestplaces.com/wp-json',
            username: 'xanis',
            password: 'Redis2022@)@@',
            auth: true
        } as WPAPIOptions);

        return Promise.resolve(wp);
    }

}