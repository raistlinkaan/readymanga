angular.module("mangasApp", ['ngRoute', 'ngAnimate','toaster','cgBusy'])
    .factory('MangalistDto', function () {
        var MangalistDto = function (data) {
            angular.extend(this, {
                pageSize: 12,
                pageIndex: 1,
                total: 0,
                keyword: '',
                category: ''
            });
            angular.extend(this, data);
        }
        
        //delete MangalistDto.paging.list;
        return MangalistDto;
    })
    .config(function ($routeProvider) {
        $routeProvider
            .when("/", {
                templateUrl: "views/list.html",
                controller: "ListController"
            })
            .when("/manga/:id", {
                controller: "MangaController",
                templateUrl: "views/manga.html"
            })
            .when("/read/:mangaid/:chapterid", {
                controller: "ReadController",
                templateUrl: "views/read.html"
            })
            .when("/login/", {
                controller: "LoginController",
                templateUrl: "views/login.html"
            })
            .when("/favorites/", {
                controller: "FavoritesController",
                templateUrl: "views/favorites.html"
            })
            .when("/archive/", {
                controller: "ArchiveController",
                templateUrl: "views/archive.html"
            })
            .otherwise({
                redirectTo: "/"
            })
    })
    .service("MangaService", function ($http, toaster) {
        this.getFavorites = function () {
            return $http.get("/api/manga/favorites/").then(function (response) {
                return response;
            }, function (response) {
                toaster.error("error", "Error getting manga");
            });
        },
        this.getArchive = function () {
            return $http.get("/api/manga/archive/").then(function (response) {
                return response;
            }, function (response) {
                toaster.error("error", "Error getting manga");
            });
        },
        this.addRemoveArchive = function (mangaid) {
            return $http.post("/api/manga/addRemoveArchive/", mangaid).then(function (response) {
                return response;
            }, function (response) {
                toaster.error("error", "Error getting manga");
            });
        },
        this.addRemoveFavorites = function (mangaid) {
            return $http.post("/api/manga/addRemoveFavorites/", mangaid).then(function (response) {
                return response;
            }, function (response) {
                toaster.error("error", "Error getting manga");
            });
        },
        this.markAsAllRead = function (chapters) {
            return $http.post("/api/manga/markAsAllRead/", chapters).then(function (response) {
                return response;
            }, function (response) {
                toaster.error("error", "Error getting manga");
            });
        },
        this.getMangaList = function (paging) {
            return $http.post("/api/manga/list/", paging).then(function (response) {
                return response;
            }, function (response) {
                toaster.error("error", "Error finding mangas");
            });
        },
        this.getManga = function (id) {
            var url = "/api/manga/detail/" + id;
            return $http.get(url).then(function (response) {
                return response;
            }, function (response) {
                toaster.error("error", "Error getting manga");
            });
        },
        this.getChapter = function (mangaId, chapterId) {
            var url = "/api/manga/chapter/" + mangaId + "/" + chapterId;
            return $http.get(url).then(function (response) {
                return response;
            }, function (response) {
                toaster.error("error", "Error getting chapter");
            });
        },
        this.login = function (user) {
            return $http.post("/user/login/", user).then(function (response) {
                return response;
            }, function (response) {
                toaster.error("error", "Error getting user");
            });
        },
        this.register = function (user) {
            return $http.post("/user/register/", user).then(function (response) {
                return response;
            }, function (response) {
                toaster.error("error", "Error getting user");
            });
        }
    })
    .controller("ListController", function ($scope, MangaService, MangalistDto) {
        $scope.promise = MangaService.getMangaList(new MangalistDto()).then(function (doc) {
            $scope.mangalist = htmlDecode(doc.data.list);
            $scope.paging = new MangalistDto(doc.data);
            delete $scope.paging.list;

            $scope.numberOfPages = function(){
                return Math.ceil($scope.paging.total / $scope.paging.pageSize);                
            }

            $scope.redirect = function(i){
                window.location = "/#/manga/" + i;            
            }
        });

        $scope.search = function () {
            $scope.paging.pageIndex = 1;
            $scope.promise = MangaService.getMangaList($scope.paging).then(function (doc) {
                $scope.mangalist = htmlDecode(doc.data.list);
                $scope.paging = new MangalistDto(doc.data);
                delete $scope.paging.list;
            });
        };

        $scope.pageChange = function (num) {
            $scope.paging.pageIndex += num;
            
            $scope.promise = MangaService.getMangaList($scope.paging).then(function (doc) {
                $scope.mangalist = htmlDecode(doc.data.list);
                $scope.paging = new MangalistDto(doc.data);
                delete $scope.paging.list;
            });
        };
    })
    .controller("LoginController", function ($scope, MangaService, $location, $window, toaster) {
        $scope.login = function() {
            var user = { email: $scope.login.email, password: $scope.login.password };
            $scope.promise = MangaService.login(user).then(function (doc) {
                if(doc.data.result === 1)
                {
                    $location.path('/favorites/');
                    $window.location.reload();
                }
                else
                    toaster.error("error", doc.data.error);
            });
        }

        $scope.register = function() {
            if(!$scope.register.email) {
                toaster.error("error", "Please enter a valid email");
                return;
            }

            var user = { name: $scope.register.username, email: $scope.register.email, password: $scope.register.password };
            $scope.promise = MangaService.register(user).then(function (doc) {
                if(doc.data.result === 1)
                {
                    $location.path('/favorites/');
                    $window.location.reload();
                }
                else
                    toaster.error("error", doc.data.error);
            });
        }
    })
    .controller("FavoritesController", function ($scope, MangaService, $location) {
        $scope.promise = MangaService.getFavorites().then(function (doc) {
            if(doc.data.result == 1) {
                $scope.mangalist = htmlDecode(doc.data.list);
                $scope.unreadChapters = doc.data.unreadChapters;
            }
            else
                $location.path('/login/');
        });

        $scope.getUnread = function(id) {
            return $scope.unreadChapters[id];
        }

        $scope.redirect = function(i){
            window.location = "/#/manga/" + i;            
        }

        $scope.sendToArchive = function(id){
            $scope.promise = MangaService.addRemoveArchive({id: id}).then(function (doc) {
                if(doc.data.result === 1) {
                    $scope.mangalist = $scope.mangalist.filter(function(el) {
                        return el.i !== id;
                    });
                }
                else
                    toaster.error("error", doc.data.error);
            });
        }
    })
    .controller("ArchiveController", function ($scope, MangaService, $location) {
        $scope.promise = MangaService.getArchive().then(function (doc) {
            if(doc.data.result == 1)
                $scope.mangalist = htmlDecode(doc.data.list);
            else
                $location.path('/login/');  
        });

        $scope.redirect = function(i){
            window.location = "/#/manga/" + i;            
        }

        $scope.sendToFavorites = function(id){
            $scope.promise = MangaService.addRemoveArchive({id: id}).then(function (doc) {
                if(doc.data.result === 1) {
                    $scope.mangalist = $scope.mangalist.filter(function(el) {
                        return el.i !== id;
                    });
                }
                else
                    toaster.error("error", doc.data.error);
            });
        }
    })
    .controller("MangaController", function ($scope, $routeParams, MangaService, $location, toaster) {
        $scope.promise = MangaService.getManga($routeParams.id).then(function (doc) {
            doc.data.id = $routeParams.id;
            $scope.manga = doc.data;
            $scope.manga.description = he.unescape($scope.manga.description);
            $scope.manga.status = mangastatus[$scope.manga.status];
        });

        $scope.addOrRemove = function(mangaid){
            $scope.promise = MangaService.addRemoveFavorites({id: $routeParams.id}).then(function (doc) {
                if(doc.data.result === 1)
                    $scope.manga.isFavorite = doc.data.status;
                else
                    toaster.error("error", doc.data.error);
            });
        }

        $scope.detail = function(mangaid, chapterid){
            $location.path('/read/' + mangaid + '/' + chapterid);
        }

        $scope.markAsAllRead = function(){
            var chapters = {id: $routeParams.id, chapters: getChapterIds($scope.manga.chapters)};
            $scope.promise = MangaService.markAsAllRead(chapters).then(function (doc) {
                if(doc.data.result === 1)
                    $scope.manga.readedChapters = doc.data.status;
                else
                    toaster.error("error", doc.data.error);
            });
        }
    })
    .controller("ReadController", function ($scope, $routeParams, $location, $anchorScroll, $window, MangaService) {
        $scope.currentImage = "0";
        
        if($routeParams.chapterid && $routeParams.mangaid)
        {
            $scope.promise = MangaService.getManga($routeParams.mangaid).then(function (doc) {
                $scope.manga = doc.data;
                $scope.manga.id = $routeParams.mangaid;
                $scope.selectedChapterId = $routeParams.chapterid;
                $scope.selectedChapterOrder = getChapterCount($scope.manga.chapters, $scope.selectedChapterId);

                MangaService.getChapter($routeParams.mangaid, $routeParams.chapterid).then(function (doc) {
                    $scope.chapter = doc.data;
                    $scope.totalImages = $scope.chapter.images.length -1;
                });
            });
        }

        $scope.imageLoaded = function () {
            
        };

        $scope.nextImage = function () {
            if(parseInt($scope.currentImage) != $scope.totalImages)
            {
                run_waitMe($('#img_page'));
                $scope.currentImage = (parseInt($scope.currentImage) + 1).toString();

                $location.hash('dynamicImg');
                $anchorScroll();
            }
            else
            {
                $scope.selectedChapterOrder--;
                $location.path("/read/"+ $routeParams.mangaid+ "/" + $scope.manga.chapters[$scope.selectedChapterOrder][3]);
            }

            $window.scrollTo(0, angular.element(document.getElementById('dynamicImg')).offset().top);
        };

        $scope.nextChapter = function () {
            $scope.selectedChapterOrder--;
            $location.path("/read/"+ $routeParams.mangaid+ "/" + $scope.manga.chapters[$scope.selectedChapterOrder][3]);
        };

        $scope.prevChapter = function () {
            $scope.selectedChapterOrder++;
            $location.path("/read/"+ $routeParams.mangaid+ "/" + $scope.manga.chapters[$scope.selectedChapterOrder][3]);
        };

        $scope.changeChapter = function () {
            $location.path("/read/"+ $routeParams.mangaid+ "/" + $scope.selectedChapterId);
        };
    }).directive('imageonload', function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                element.bind('load', function() {
                    $('#img_page').waitMe('hide');
                });
                element.bind('error', function(){
                    alert('image could not be loaded');
                });
            }
        };
    });

function htmlDecode(arr)
{
    _.each(arr, function(item) {
        item.t = he.unescape(item.t);
    });

    return arr;
}
function getChapterCount(arr,id)
{
    for(var i = 0; i<arr.length; i++)
    {
        if(arr[i][3] == id)
            return i;
    }
}

function getChapterIds(chapters)
{
    var ids = [];
    for(var i = 0; i < chapters.length; i++)
    {
        ids.push(chapters[i][3]);
    }

    return ids;
}

function run_waitMe(el){
    el.waitMe({
        effect: 'bounce',
        text: 'Please wait...',
        bg: 'rgba(255,255,255,0.7)',
        color: '#000',
        maxSize: '',
        waitTime: -1,
        source: 'img.svg',
        textPos: 'vertical',
        fontSize: '',
        onClose: function(el) {}
    });
}